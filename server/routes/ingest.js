const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');
const ingestionService = require('../services/ingestionService');
const createSlidingRateLimiter = require('../middleware/rateLimit');

const ingestRateLimit = createSlidingRateLimiter('ingest', 5, 60); // 5 documents per 60 minutes

router.post('/', authMiddleware, ingestRateLimit, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Determine companyId from authenticated user
    const companyId = req.user.company_id;
    if (!companyId) {
        return res.status(400).json({ error: 'User is not associated with a company' });
    }

    // In a real production app, we would push this to a queue (BullMQ)
    // For this MVP, we await it (or we could fire-and-forget, but users like feedback)
    const result = await ingestionService.processFile(req.file, req.user, companyId);

    res.json({
      message: 'File ingested successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
