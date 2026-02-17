const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const supabase = require('../config/supabase');

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.company_id;

    // Run counts in parallel - filter by both company AND role
    const [docsResult, decisionsResult] = await Promise.all([
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('role_id', req.user.role_id),
      supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('role_id', req.user.role_id)  // Filter by user's role
    ]);

    if (docsResult.error) throw docsResult.error;
    if (decisionsResult.error) throw decisionsResult.error;

    res.json({
      documents: docsResult.count,
      decisions: decisionsResult.count
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/activity
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const limit = 5; // Get top 5 from each and merge

    // Fetch recent documents - filter by role_id
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('id, filename, created_at, status')
      .eq('company_id', companyId)
      .eq('role_id', req.user.role_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (docsError) throw docsError;

    // Fetch recent decisions - filter by role_id
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions')
      .select('id, title, created_at, profiles(full_name)')
      .eq('company_id', companyId)
      .eq('role_id', req.user.role_id)  // Filter by user's role
      .order('created_at', { ascending: false })
      .limit(limit);

    if (decisionsError) throw decisionsError;

    // Normalize and merge
    const normalizedDocs = docs.map(d => ({
      id: d.id,
      type: 'document',
      label: `Document "${d.filename}" processed`, // or status
      meta: d.status,
      created_at: d.created_at
    }));

    const normalizedDecisions = decisions.map(d => ({
      id: d.id,
      type: 'decision',
      label: `Decision "${d.title}" created`,
      meta: `by ${d.profiles?.full_name || 'Unknown'}`,
      created_at: d.created_at
    }));

    const activity = [...normalizedDocs, ...normalizedDecisions]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5); // Return top 5 combined

    res.json(activity);

  } catch (error) {
    console.error('Dashboard Activity Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
