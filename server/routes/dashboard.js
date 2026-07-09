const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const supabase = require('../config/supabase');
const { getCache, setCache } = require('../config/redis');

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const workspaceId = req.user.workspace_id;
    const cacheKey = `cache:dashboard:stats:workspace:${workspaceId}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    // Run counts in parallel
    const [docsResult, decisionsResult, integrationItemsResult] = await Promise.all([
      // Uploaded documents
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('workspace_id', workspaceId),
      // Decisions
      supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('workspace_id', workspaceId),
      // Integration-sourced items (Notion, Slack, etc.) that are indexed
      supabase
        .from('integration_items')
        .select('*, integrations!inner(workspace_id)', { count: 'exact', head: true })
        .eq('integrations.workspace_id', workspaceId)
        .eq('status', 'indexed')
    ]);

    if (docsResult.error) throw docsResult.error;
    if (decisionsResult.error) throw decisionsResult.error;
    // integrationItemsResult error is non-fatal — just default to 0

    const uploadedDocs = docsResult.count ?? 0;
    const integrationDocs = integrationItemsResult.count ?? 0;

    const responseData = {
      documents: uploadedDocs + integrationDocs,   // Total indexed knowledge
      uploaded_documents: uploadedDocs,             // Breakdown: direct uploads
      integration_documents: integrationDocs,       // Breakdown: via integrations
      decisions: decisionsResult.count ?? 0
    };

    await setCache(cacheKey, responseData, 60);
    res.json(responseData);

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: error.message });
  }
});


// GET /api/dashboard/activity
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const workspaceId = req.user.workspace_id;
    const limit = 5;
    const cacheKey = `cache:dashboard:activity:workspace:${workspaceId}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const [docsRes, decisionsRes, integrationItemsRes] = await Promise.all([
      // Uploaded documents
      supabase
        .from('documents')
        .select('id, filename, created_at, status')
        .eq('company_id', companyId)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit),

      // Decisions
      supabase
        .from('decisions')
        .select('id, title, created_at, profiles(full_name)')
        .eq('company_id', companyId)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit),

      // Integration-synced items
      supabase
        .from('integration_items')
        .select('id, title, last_synced_at, status, integrations!inner(provider, workspace_id)')
        .eq('integrations.workspace_id', workspaceId)
        .eq('status', 'indexed')
        .order('last_synced_at', { ascending: false })
        .limit(limit)
    ]);

    if (docsRes.error) throw docsRes.error;
    if (decisionsRes.error) throw decisionsRes.error;
    // integrationItemsRes is non-fatal

    const normalizedDocs = (docsRes.data || []).map(d => ({
      id: d.id,
      type: 'document',
      label: `Document "${d.filename}" indexed`,
      meta: d.status,
      created_at: d.created_at
    }));

    const normalizedDecisions = (decisionsRes.data || []).map(d => ({
      id: d.id,
      type: 'decision',
      label: `Decision "${d.title}" created`,
      meta: `by ${d.profiles?.full_name || 'Unknown'}`,
      created_at: d.created_at
    }));

    const normalizedIntegrations = (integrationItemsRes.data || []).map(item => ({
      id: item.id,
      type: 'integration',
      label: `"${item.title}" synced from ${item.integrations?.provider || 'integration'}`,
      meta: 'indexed',
      created_at: item.last_synced_at || item.created_at
    }));

    const activity = [...normalizedDocs, ...normalizedDecisions, ...normalizedIntegrations]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10); // Return top 10 combined

    await setCache(cacheKey, activity, 60);
    res.json(activity);

  } catch (error) {
    console.error('Dashboard Activity Error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
