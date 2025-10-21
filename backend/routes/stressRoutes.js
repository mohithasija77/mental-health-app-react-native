const express = require('express');
const router = express.Router();
const { analyzeStress } = require('../controllers/stressController');

const rateLimit = require('express-rate-limit');

// Rate limiting for stress analysis
const stressAnalysisLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    message: 'Too many stress analysis requests, please try again later.',
    retryAfter: 15 * 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/stress/analyze - Analyze stress levels
router.post('/analyze', stressAnalysisLimit, analyzeStress);

module.exports = router;
