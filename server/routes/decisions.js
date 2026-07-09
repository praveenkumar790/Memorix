const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const decisionService = require('../services/decisionService');

// Create a new decision
router.post('/', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { title, content, tags, contextDocId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and Content are required' });
    }

    const decision = await decisionService.createDecision(req.user, companyId, {
      title, content, tags, contextDocId
    });

    res.status(201).json(decision);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// List decisions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const decisions = await decisionService.listDecisions(companyId, req.user.workspace_id, limit, offset);
    res.json(decisions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
