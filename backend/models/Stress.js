// File: models/Stress.js

const mongoose = require('mongoose');

const stressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    answers: {
      type: Map,
      of: Number,
      required: true,
    },
    stressScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    stressLevel: {
      type: String,
      required: true,
      enum: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
    },
    analysis: {
      type: String,
      required: true,
    },
    recommendations: [
      {
        type: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
stressSchema.index({ userId: 1, createdAt: -1 });

// Virtual for getting formatted date
stressSchema.virtual('formattedDate').get(function () {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

// Method to get stress level color
stressSchema.methods.getStressColor = function () {
  const colors = {
    'Very Low': '#4CAF50',
    Low: '#8BC34A',
    Moderate: '#FFC107',
    High: '#FF9800',
    'Very High': '#F44336',
  };
  return colors[this.stressLevel] || '#757575';
};

// Static method to get average stress for a user
stressSchema.statics.getAverageStress = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        averageStress: { $avg: '$stressScore' },
        count: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { averageStress: 0, count: 0 };
};

// Static method to get stress trend
stressSchema.statics.getStressTrend = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
          },
        },
        averageStress: { $avg: '$stressScore' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return result;
};

// Pre-save middleware to update the updatedAt field
stressSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Pre-remove middleware for cleanup
stressSchema.pre('remove', async function (next) {
  // Add any cleanup logic here if needed
  next();
});

module.exports = mongoose.model('Stress', stressSchema);
