const express = require('express');
const router = express.Router();
const weeklySummaryController = require('../controllers/weeklySummaryController');

// Generate weekly mental health summary
router.post('/weekly-summary', weeklySummaryController.generateWeeklySummary);

// Quick mood check
router.post('/mood-check', weeklySummaryController.quickMoodCheck);

// Get weekly data for a specific date range
router.get(
  '/weekly-data/:startDate/:endDate',
  weeklySummaryController.getWeeklyData
);

// Save daily check-in (for building weekly data)
router.post('/daily-checkin', weeklySummaryController.saveDailyCheckin);

module.exports = router;
