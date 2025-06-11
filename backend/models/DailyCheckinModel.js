const mongoose = require('mongoose');

// Daily Check-in Schema
const dailyCheckinSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    wellnessScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    feelingScale: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    mood: {
      type: String,
      required: true,
      enum: [
        'happy',
        'sad',
        'anxious',
        'excited',
        'calm',
        'angry',
        'hopeful',
        'overwhelmed',
        'grateful',
        'frustrated',
      ],
    },
    sleepQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    stressLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    activities: [
      {
        type: String,
      },
    ],
    notes: {
      type: String,
      maxlength: 500,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
// Compound index for efficient queries
dailyCheckinSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyCheckinModel = mongoose.model(
  'DailyCheckinModel',
  dailyCheckinSchema
);

module.exports = {
  DailyCheckinModel,
};
