const mongoose = require('mongoose');

// Weekly Summary Schema
const weeklySummarySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    weekEndDate: {
      type: Date,
      required: true,
    },
    summary: {
      period: {
        startDate: Date,
        endDate: Date,
        totalDays: Number,
      },
      averages: {
        wellnessScore: Number,
        feelingScale: Number,
        sleepQuality: Number,
        stressLevel: Number,
      },
      trends: {
        moodFrequency: mongoose.Schema.Types.Mixed,
        wellnessScoreTrend: {
          type: String,
          enum: ['improving', 'declining', 'stable'],
        },
        bestDay: mongoose.Schema.Types.Mixed,
        challengingDay: mongoose.Schema.Types.Mixed,
      },
      insights: {
        aiSummary: String,
        keyPatterns: [String],
        recommendations: [String],
      },
    },
    dailyCheckinIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyCheckinModel',
      },
    ],
  },
  {
    timestamps: true,
  }
);

weeklySummarySchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });
const WeeklySummary = mongoose.model('WeeklySummaryModel', weeklySummarySchema);

module.exports = {
  WeeklySummary,
};
