const supabase = require('../config/supabase');
const { pineconeIndex } = require('../config/pinecone');
// Gemini embedding model is no longer needed - using Pinecone's integrated embedding
// const { embeddingModel } = require('../config/gemini');
const { generateNamespace } = require('../utils/namespace');
const { getCache, setCache, deleteCache } = require('../config/redis');

const decisionService = {
  async createDecision(user, companyId, data) {
    const { title, content, tags, contextDocId } = data;

    // 1. Save to PostgreSQL with workspace_id
    const { data: decision, error } = await supabase
      .from('decisions')
      .insert({
        company_id: companyId,
        author_id: user.id,
        workspace_id: user.workspace_id,  // Store user's workspace_id
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
    
    // Namespace format: ns-{workspaceId}
    const namespace = generateNamespace(user);
    await pineconeIndex.upsertRecords({
      namespace: namespace,
      records: [{
        _id: `decision_${decision.id}`,
        text: textToEmbed,  // This field will be embedded by Pinecone
        type: 'decision',
        title: title,
        decision_id: decision.id,
        decision_id: decision.id,
        company_id: companyId,
        workspace_id: user.workspace_id,
        tags: tags ? tags.join(',') : ''
      }]
    });

    // Invalidate the recent decisions cache for this workspace
    await deleteCache(`cache:decisions:recent:workspace:${user.workspace_id}`);
    
    // Invalidate dashboard caches
    await deleteCache(`cache:dashboard:stats:workspace:${user.workspace_id}`);
    await deleteCache(`cache:dashboard:activity:workspace:${user.workspace_id}`);

    return decision;
  },

  async listDecisions(companyId, workspaceId, limit = 20, offset = 0) {
    const isRecentCacheable = (limit === 5 && offset === 0);
    const cacheKey = `cache:decisions:recent:workspace:${workspaceId}`;

    if (isRecentCacheable) {
      const cached = await getCache(cacheKey);
      if (cached) return cached;
    }

    const { data, error } = await supabase
      .from('decisions')
      .select('*, profiles(full_name)') // join with profiles to get author name
      .eq('company_id', companyId)
      .eq('workspace_id', workspaceId)  // Filter by workspace_id
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Decision List Error: ${error.message}`);
    
    if (isRecentCacheable) {
      await setCache(cacheKey, data, 3600);
    }

    return data;
  }
};

module.exports = decisionService;
