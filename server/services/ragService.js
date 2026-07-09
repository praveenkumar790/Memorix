const { pineconeIndex } = require('../config/pinecone');
const { model } = require('../config/gemini');
const decisionService = require('./decisionService');
const supabase = require('../config/supabase');
const { generateNamespace } = require('../utils/namespace');
const { redis, deleteCache } = require('../config/redis');

/**
 * Detects if a Decision and a Document chunk contradict each other.
 * Returns { conflict: boolean, reason: string } or null on failure.
 * Fails silently — never breaks the main chat flow.
 */
async function detectConflict(decision, docHit) {
  if (!decision || !docHit) return null;

  const decisionSnippet = (decision.content || '').slice(0, 300);
  const docSnippet = (docHit.fields.text || '').slice(0, 300);

  if (!decisionSnippet || !docSnippet) return null;

  const prompt = `Decision: "${decisionSnippet}"
Document chunk: "${docSnippet}"

Do these two pieces of information contradict each other on any policy, process, or fact?
Reply ONLY with valid JSON (no markdown, no extra text):
{ "conflict": true or false, "reason": "one sentence explanation or empty string" }`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    // Strip markdown code fences if model wraps the response
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null; // Fail silently
  }
}

const ragService = {
  async handleChat(user, companyId, message, res, existingChatId = null, options = {}) {
    try {
      let chatId = existingChatId;

      // 1. Retrieve Recent Decisions (The "Memory")
      // We prioritize recent decisions to override old docs
      const decisions = await decisionService.listDecisions(companyId, user.workspace_id, 5, 0);
      const decisionContext = decisions.map(d => 
        `[DECISION] ${d.title} (Author: ${d.profiles?.full_name || 'Unknown'}, Date: ${new Date(d.created_at).toISOString().split('T')[0]})\n${d.content}`
      ).join('\n\n');

      // Fetch chat history for context
      let chatHistoryText = '';
      if (chatId) {
          try {
              const cachedMessages = await redis.lrange(`cache:chat:messages:${chatId}`, 0, 9); // Last 10 messages
              if (cachedMessages && cachedMessages.length > 0) {
                  // Usually stored chronologically if we push, but let's just make sure.
                  // Since we RPUSH, index 0 is oldest, 9 is newest.
                  const historyArr = cachedMessages.map(msg => JSON.parse(msg));
                  chatHistoryText = historyArr.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');
              } else {
                  const { data: dbMessages } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: false }).limit(10);
                  if (dbMessages && dbMessages.length > 0) {
                      chatHistoryText = dbMessages.reverse().map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');
                  }
              }
          } catch (err) {
              console.error('Error fetching chat history:', err);
          }
      }

      // 2. Condense the question before searching
      // Prepending raw chat history dilutes the vector embedding. We rewrite it into a standalone query.
      let searchQuery = message;
      if (chatHistoryText) {
          try {
              const condensePrompt = `Given the following conversation history and the current user question, rewrite the user question into a standalone query that can be used for semantic search. Do not answer the question, just rewrite it to be fully self-contained based on the context (e.g., resolving pronouns or "it" to the actual topic). If the current question is already standalone, just return it without changes.

Conversation History:
${chatHistoryText}

Current Question: ${message}

Standalone Query:`;
              const condenseResult = await model.generateContent(condensePrompt);
              searchQuery = condenseResult.response.text().trim() || message;
              console.log(`[RAG] Condensed query from "${message}" to "${searchQuery}"`);
          } catch (err) {
              console.error('Error condensing question:', err);
              // Fallback to raw message, not the concatenated mess
          }
      }

      // 3. Search + Rerank using Pinecone's integrated inference

      const namespace = generateNamespace(user);
      const searchResult = await pineconeIndex.searchRecords({
        namespace: namespace,
        query: {
          topK: 10,              // cast a wide net
          inputs: { text: searchQuery }
        },
        fields: ['text', 'filename', 'page_number', 'document_id', 'company_id', 'workspace_id',
                 'provider', 'sourceId', 'sourceTitle', 'sourceUrl', 'author', 'createdAt'],
        rerank: {
          model: 'bge-reranker-v2-m3',  // Pinecone-hosted cross-encoder (free tier)
          topN: 3,                       // only keep the 3 most relevant after re-ranking
          rankFields: ['text']           // score chunks by their text content vs. the query
        }
      });

      const hits = searchResult.result.hits;

      // Build source citations from the re-ranked hits
      // These are now genuinely relevant — the cross-encoder confirms it
      const rawSources = [];
      for (const hit of hits) {
        let url = hit.fields.sourceUrl || null;

        // For uploaded documents, sourceUrl is a Supabase storage path — build a secure signed URL
        if (hit.fields.provider === 'document' && url && !url.startsWith('http')) {
          const { data, error } = await supabase.storage.from('memorix').createSignedUrl(url, 3600);
          if (!error && data) {
            url = data.signedUrl;
          } else {
             console.error("Error creating signed URL:", error);
             url = null; // Don't expose broken URLs or raw storage paths
          }
        }

        rawSources.push({
          provider: hit.fields.provider || 'document',
          title: hit.fields.sourceTitle || hit.fields.filename || 'Unknown',
          url: url,
          author: hit.fields.author || null,
        });
      }

      // Deduplicate by title — one citation per document, not per chunk
      const uniqueSources = [...new Map(rawSources.map(s => [s.title, s])).values()];

      // Format the re-ranked chunks as structured context for the LLM
      const docContext = hits.map((hit, i) =>
        `[SOURCE ${i + 1}: ${hit.fields.sourceTitle || hit.fields.filename || 'Unknown'}]\n${hit.fields.text}`
      ).join('\n\n');

      // 4. Construct System Prompt (Reasoning-aware)
      const systemPrompt = `You are Memorix, an intelligent AI assistant for internal organizational use.
Workspace: ${user.workspace_name || 'unknown'}

CORE INSTRUCTIONS:
1. You have access to two knowledge sources: "Organizational Decisions" (authoritative) and "Document Knowledge" (reference).
2. **DECISIONS ARE SUPREME.** If a Decision contradicts a Document chunk on any policy or fact, always follow the Decision and note that it overrides the document.
3. **CONFIDENCE:** Only answer from the context provided. If the context does not contain enough information to answer confidently, say so clearly — do not speculate or hallucinate.
4. **CITATIONS:** Do not use numbered citations like [1], [2] in your response text. Write naturally. The system will automatically attach the source list below your answer.
5. Use proper markdown (bold headers, bullet points, code blocks where appropriate).
6. Be concise but complete — prioritize accuracy over length.

CONTEXT:
---
ORGANIZATIONAL DECISIONS (Highest Priority — override documents if conflicting):
${decisionContext || 'No active decisions.'}
---
DOCUMENT KNOWLEDGE (Re-ranked by relevance to the question):
${docContext || 'No relevant documents found.'}
---
PREVIOUS CONVERSATION HISTORY:
${chatHistoryText || 'No previous history.'}
---
`;

      // 5. Conflict Detection — check if newest Decision contradicts top doc chunk
      let conflictWarning = null;
      if (decisions.length > 0 && hits.length > 0) {
        conflictWarning = await detectConflict(decisions[0], hits[0]);
      }

      // 6. Generate and Stream Response
      const result = await model.generateContentStream({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + `\nUSER QUESTION: ${message}` }] }
        ]
      });

      // 7. Manage Chat Session (Create or Reuse)
      if (!chatId) {
          // Create new chat
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .insert({ company_id: companyId, workspace_id: user.workspace_id, user_id: user.id, title: message.substring(0, 50) })
            .select()
            .single();
          
          if (chatError) throw chatError;
          chatId = chatData.id;
          
          // Invalidate chat list cache
          await deleteCache(`cache:chats:list:workspace:${user.workspace_id}:user:${user.id}`);
      } else {
          // Verify ownership (optional but good security)
          const { data: chatData, error: chatError } = await supabase
              .from('chats')
              .select('id')
              .eq('id', chatId)
              .eq('user_id', user.id)
              .single();
          
          if (!chatData || chatError) {
              // If invalid chat ID, create new one
               const { data: newChat, error: newChatError } = await supabase
                .from('chats')
                .insert({ company_id: companyId, workspace_id: user.workspace_id, user_id: user.id, title: message.substring(0, 50) })
                .select()
                .single();
               chatId = newChat.id;
               
               // Invalidate chat list cache
               await deleteCache(`cache:chats:list:workspace:${user.workspace_id}:user:${user.id}`);
          }
      }

      // 7. Save User Message
      if (chatId && !options.skipSaveUserMessage) {
         const { data: savedUserMsg } = await supabase.from('messages').insert({
             chat_id: chatId,
             role: 'user',
             content: message
         }).select().single();

         // Hot Tail: cache recent messages
         if (savedUserMsg) {
           try {
             await redis.rpush(`cache:chat:messages:${chatId}`, JSON.stringify(savedUserMsg));
             await redis.ltrim(`cache:chat:messages:${chatId}`, -50, -1);
           } catch (err) {
             console.error('Redis List push error:', err.message);
           }
         }
      }

      // Stream to client
      // Send chatId, sources, and any conflict warning BEFORE the AI text stream begins
      res.write(`data: ${JSON.stringify({ chatId: chatId })}\n\n`);
      res.write(`data: ${JSON.stringify({ sources: uniqueSources })}\n\n`);

      if (conflictWarning?.conflict && decisions.length > 0) {
        const overridingDecision = decisions[0];
        res.write(`data: ${JSON.stringify({
          conflict: true,
          conflictReason: conflictWarning.reason,
          overridingDecision: {
            title: overridingDecision.title,
            date: overridingDecision.created_at,
            author: overridingDecision.profiles?.full_name || 'Unknown'
          }
        })}\n\n`);
      }

      let fullResponse = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        
        // Simulate a smooth typewriter effect by streaming small chunks with a tiny delay
        // Gemini Flash is often so fast it returns the entire response in 1-2 chunks
        const chunkSize = 4; // 4 characters at a time
        for (let i = 0; i < chunkText.length; i += chunkSize) {
          const piece = chunkText.slice(i, i + chunkSize);
          res.write(`data: ${JSON.stringify({ content: piece })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
        }
      }

      // Save assistant response to DB
      if (chatId) {
          // Extract sources from fullResponse if possible, or just save generic
          const { data: savedAsstMsg } = await supabase.from('messages').insert({
              chat_id: chatId,
              role: 'assistant',
              content: fullResponse
          }).select().single();

          // Hot Tail: cache recent messages
          if (savedAsstMsg) {
            try {
              await redis.rpush(`cache:chat:messages:${chatId}`, JSON.stringify(savedAsstMsg));
              await redis.ltrim(`cache:chat:messages:${chatId}`, -50, -1);
            } catch (err) {
              console.error('Redis List push error:', err.message);
            }
          }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();

    } catch (error) {
      console.error("RAG Error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};

module.exports = ragService;
