const { pineconeIndex } = require('../config/pinecone');
const { model } = require('../config/gemini');  // Only need model for chat generation
const decisionService = require('./decisionService');
const supabase = require('../config/supabase');
const { generateNamespace } = require('../utils/namespace');

const ragService = {
  async handleChat(user, companyId, message, res, existingChatId = null) {
    try {
      let chatId = existingChatId;

      // 1. Retrieve Recent Decisions (The "Memory")
      // We prioritize recent decisions to override old docs
      const decisions = await decisionService.listDecisions(companyId, user.role_id, 5, 0);
      const decisionContext = decisions.map(d => 
        `[DECISION] ${d.title} (Author: ${d.profiles?.full_name || 'Unknown'}, Date: ${new Date(d.created_at).toISOString().split('T')[0]})\n${d.content}`
      ).join('\n\n');

      // 2. Search using Pinecone's Integrated Embedding
      // Pinecone will automatically generate embeddings from the message text
      // Namespace format: ns-{userName}-{role}-{userId}
      const namespace = generateNamespace(user);
      const searchResult = await pineconeIndex.searchRecords({
        namespace: namespace,
        query: {
          topK: 5,
          inputs: {
            text: message  // Pinecone converts this to embedding using llama-text-embed-v2
          }
        },
        fields: ['text', 'filename', 'page_number', 'document_id', 'company_id', 'role_id']
      });

      // Get unique filenames
      const uniqueFiles = [...new Set(searchResult.result.hits.map(hit => hit.fields.filename || 'Unknown'))];
      const sourcesList = uniqueFiles.map(filename => `- ${filename}`).join('\n');

      const docContext = searchResult.result.hits.map(hit => 
        `[SOURCE: ${hit.fields.filename || 'Unknown'}]\n${hit.fields.text}`
      ).join('\n\n');

      // 4. Construct System Prompt
      const systemPrompt = `You are Memorix, an intelligent AI assistant for ${companyId} (Internal use).
User Role: ${user.role_name || 'unknown'}

CORE INSTRUCTIONS:
1. You have access to "Organizational Decisions" and "Document Knowledge".
2. **DECISIONS ARE SUPREME.** If a user asks about a policy, and a recent [DECISION] contradicts a [SOURCE], you MUST follow the [DECISION].
3. **IMPORTANT CITATION FORMAT**: 
   - Do NOT use numbered citations like [1], [2], [5] in your response
   - Write naturally without inline references
   - At the very end, list the source files under a "**Sources:**" section
   - Use this exact format for sources:
     
     **Sources:**
${sourcesList}
     
4. Be professional, concise, and helpful.
5. Use proper markdown formatting (bullet points, bold headers, etc.)

CONTEXT:
---
RECENT DECISIONS (High Priority):
${decisionContext}
---
DOCUMENT KNOWLEDGE (Reference):
${docContext}
---
`;

      // 5. Generate and Stream Response
      const result = await model.generateContentStream({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + `\nUSER QUESTION: ${message}` }] }
        ]
      });

      // 6. Manage Chat Session (Create or Reuse)
      if (!chatId) {
          // Create new chat
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .insert({ company_id: companyId, user_id: user.id, title: message.substring(0, 50) })
            .select()
            .single();
          
          if (chatError) throw chatError;
          chatId = chatData.id;
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
                .insert({ company_id: companyId, user_id: user.id, title: message.substring(0, 50) })
                .select()
                .single();
               chatId = newChat.id;
          }
      }

      // 7. Save User Message
      if (chatId) {
         await supabase.from('messages').insert({
             chat_id: chatId,
             role: 'user',
             content: message
         });
      }

      // Stream to client
      // First, send the chatId metadata
      res.write(`data: ${JSON.stringify({ chatId: chatId })}\n\n`);

      let fullResponse = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        // console.log('Sending chunk:', chunkText); // Verbose log
        res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
      }

      // Save assistant response to DB
      if (chatId) {
          // Extract sources from fullResponse if possible, or just save generic
          await supabase.from('messages').insert({
              chat_id: chatId,
              role: 'assistant',
              content: fullResponse
          });
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
