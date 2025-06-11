const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');

// Mental Health Check-in Routes

/**
 * POST /api/mental-health/analyze
 * Main endpoint for comprehensive mental health analysis
 * Expected body: {
 *   feelingScale: number (1-10),
 *   sleepQuality: number (1-10),
 *   stressLevel: number (1-10),
 *   mood: string,
 *   recentEvents: string (optional),
 *   additionalNotes: string (optional)
 * }
 */
router.post('/analyze', checkinController.analyzeMentalHealth);

/**
 * POST /api/mental-health/mood-check
 * Quick mood check endpoint for simpler interactions
 * Expected body: {
 *   mood: string,
 *   feelingScale: number (1-10)
 * }
 */
router.post('/mood-check', checkinController.quickMoodCheck);

/**
 * GET /api/mental-health/health
 * Health check endpoint to verify the service is running
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Mental Health Check-in API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      analyze: 'POST /api/mental-health/analyze',
      moodCheck: 'POST /api/mental-health/mood-check',
      health: 'GET /api/mental-health/health',
    },
  });
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Mental Health API Error:', error);

  res.status(500).json({
    success: false,
    error: 'Mental Health API Error',
    message: 'An error occurred while processing your mental health data',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
