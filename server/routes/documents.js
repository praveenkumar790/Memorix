const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const supabase = require('../config/supabase');

// GET /api/documents - Fetch recent documents for the user's company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.company_id;

    if (!companyId) {
      return res.status(400).json({ error: 'User is not associated with a company' });
    }

    // Fetch recent documents for user's workspace only
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .eq('workspace_id', req.user.workspace_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json(documents);

  } catch (error) {
    console.error('Documents Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
