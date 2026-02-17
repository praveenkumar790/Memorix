const supabase = require('../config/supabase');
const { pineconeIndex } = require('../config/pinecone');
// Gemini embedding model is no longer needed - using Pinecone's integrated embedding
// const { embeddingModel } = require('../config/gemini');
const { generateNamespace } = require('../utils/namespace');

const decisionService = {
  async createDecision(user, companyId, data) {
    const { title, content, tags, contextDocId } = data;

    // 1. Save to PostgreSQL with role_id
    const { data: decision, error } = await supabase
      .from('decisions')
      .insert({
        company_id: companyId,
        author_id: user.id,
        role_id: user.role_id,  // Store user's role_id
        title,
        content,
        tags,
        context_doc_id: contextDocId
      })
      .select()
      .single();

    if (error) throw new Error(`Decision DB Insert Error: ${error.message}`);

    // 2. Upsert to Pinecone using Integrated Embedding
    // Pinecone will automatically generate embeddings from the text
    const textToEmbed = `Decision: ${title}\nContent: ${content}`;
    
    // Namespace format: ns-{companyName}-{role}
    const namespace = generateNamespace(user);
    await pineconeIndex.upsertRecords({
      namespace: namespace,
      records: [{
        _id: `decision_${decision.id}`,
        text: textToEmbed,  // This field will be embedded by Pinecone
        type: 'decision',
        title: title,
        decision_id: decision.id,
        company_id: companyId,
        tags: tags ? tags.join(',') : ''
      }]
    });

    return decision;
  },

  async listDecisions(companyId, roleId, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('decisions')
      .select('*, profiles(full_name)') // join with profiles to get author name
      .eq('company_id', companyId)
      .eq('role_id', roleId)  // Filter by role_id
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Decision List Error: ${error.message}`);
    return data;
  }
};

module.exports = decisionService;
