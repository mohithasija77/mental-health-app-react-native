// routes/export.js
const express = require('express');
const router = express.Router();

// POST /api/mental-health/export/weekly-summary
router.post('/weekly-summary', async (req, res) => {
  try {
    const exportData = req.body;

    // Validate required data
    if (!exportData.exportInfo?.userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required for export',
      });
    }

    // You can save the export data to your database for audit purposes
    const exportRecord = {
      userId: exportData.exportInfo.userId,
      exportType: 'weekly_summary',
      exportDate: new Date(),
      period: exportData.period,
      dataExported: exportData,
      // Add any other fields you want to track
    };

    // Optional: Save to your exports collection/table
    // If you're using MongoDB:
    // const Export = require('../models/Export'); // Create this model if needed
    // await Export.create(exportRecord);

    // If you're using a different database, adjust accordingly

    // For now, just return success with the processed data
    const response = {
      success: true,
      message: 'Weekly summary exported successfully',
      export: {
        id: `export_${Date.now()}`, // Generate a unique export ID
        userId: exportData.exportInfo.userId,
        exportDate: exportData.exportInfo.exportDate,
        period: `${exportData.period.weekStart.split('T')[0]} to ${
          exportData.period.weekEnd.split('T')[0]
        }`,
        totalCheckIns: exportData.summary.totalCheckIns,
        averageWellnessScore: exportData.summary.averages.wellnessScore,
        dominantMood: getDominantMood(exportData.trends.moodFrequency),
        keyInsights: exportData.insights.keyPatterns?.length || 0,
      },
      downloadInfo: {
        format: 'JSON',
        size: JSON.stringify(exportData).length + ' bytes',
        timestamp: new Date().toISOString(),
      },
    };

    // Log the export for monitoring
    console.log(
      `Weekly summary exported for user: ${exportData.exportInfo.userId}, Period: ${exportData.period.weekStart} - ${exportData.period.weekEnd}`
    );

    res.json(response);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export weekly summary',
      details: error.message,
    });
  }
});

// Optional: GET /api/mental-health/export/history/:userId
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch export history from your database
    // If you implement export tracking in your database:
    // const exports = await Export.find({ userId }).sort({ exportDate: -1 }).limit(10);

    // For now, return empty array
    res.json({
      success: true,
      exports: [], // Replace with actual export history when you implement it
      message: 'Export history retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching export history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch export history',
    });
  }
});

// Helper function to get the most frequent mood
function getDominantMood(moodFrequency) {
  if (!moodFrequency || Object.keys(moodFrequency).length === 0) {
    return 'No mood data';
  }

  return Object.entries(moodFrequency).sort(([, a], [, b]) => b - a)[0][0];
}

module.exports = router;
