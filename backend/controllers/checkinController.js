const {
  DailyCheckinModel: DailyCheckin,
} = require('../models/DailyCheckinModel');
const { DailyCheckinModel } = require('../models/DailyCheckinModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const checkinController = {
  // Main data analysis endpoint - focuses on trends and patterns
  analyzeMentalHealth: async (req, res) => {
    try {
      const {
        userId,
        feelingScale,
        sleepQuality,
        stressLevel,
        mood,
        recentEvents,
        additionalNotes,
        activities = [],
      } = req.body;

      // Validate required fields
      const validationError = validateCheckInData({ ...req.body, userId });
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError,
          message: 'Validation failed',
        });
      }

      //  Check for existing check-in first
      const existingCheckin = await DailyCheckin.findOne({
        userId,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(),
        },
      });

      if (existingCheckin) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate check-in',
          message: 'You have already submitted a check-in for today',
        });
      }

      // Calculate wellness score
      const wellnessScore = calculateDailyScore({
        feelingScale,
        sleepQuality,
        stressLevel,
      });

      // Generate insights
      const dataInsights = generateDataInsights(wellnessScore, {
        feelingScale,
        sleepQuality,
        stressLevel,
        mood,
      });

      const supportiveInsights = await generateSupportiveInsights(req.body);

      // Save to DB
      const dailyCheckin = await saveDailyCheckin({
        userId,
        wellnessScore,
        feelingScale,
        sleepQuality,
        stressLevel,
        mood,
        recentEvents,
        activities,
        notes: additionalNotes,
      });

      const recentTrends = await getRecentTrends(userId, 7);

      // Respond
      return res.json({
        success: true,
        analysis: {
          wellnessScore,
          dataInsights,
          supportiveInsights,
          trends: recentTrends,
          summary: {
            feelingScale,
            sleepQuality,
            stressLevel,
            mood,
          },
          timestamp: new Date().toISOString(),
          checkinId: dailyCheckin._id,
        },
      });
    } catch (error) {
      console.error('Error in analyzeMentalHealth:', error);

      if (error.message?.includes('API key')) {
        return res.status(500).json({
          success: false,
          error: 'AI service configuration error',
          message: 'Unable to connect to insight generation service',
        });
      }

      // DB unique constraint fallback
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate entry',
          message: 'You have already submitted a check-in for today',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to analyze wellness data',
      });
    }
  },

  // Quick mood tracking endpoint
  quickMoodCheck: async (req, res) => {
    try {
      const { mood, feelingScale } = req.body;

      if (!mood || !feelingScale) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: mood and feelingScale',
        });
      }

      if (feelingScale < 1 || feelingScale > 10) {
        return res.status(400).json({
          success: false,
          error: 'feelingScale must be between 1 and 10',
        });
      }

      const encouragingResponse = generateEncouragingResponse(
        mood,
        feelingScale
      );

      res.json({
        success: true,
        mood,
        feelingScale,
        encouragingResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in quickMoodCheck:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process mood tracking',
      });
    }
  },

  // Get user's check-in history(Not using anywhere for now)
  getCheckinHistory: async (req, res) => {
    try {
      const { userId } = req.params;
      const { days = 30, page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const checkins = await DailyCheckinModel.find({
        userId,
        date: { $gte: startDate },
      })
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const totalCount = await DailyCheckinModel.countDocuments({
        userId,
        date: { $gte: startDate },
      });

      res.json({
        success: true,
        data: {
          checkins,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            totalCount,
            hasNextPage: page * limit < totalCount,
          },
        },
      });
    } catch (error) {
      console.error('Error in getCheckinHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve check-in history',
      });
    }
  },

  // Get wellness trends and patterns
  getWellnessTrends: async (req, res) => {
    try {
      const { userId } = req.params;
      const { days = 7 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const trends = await DailyCheckinModel.aggregate([
        {
          $match: {
            userId,
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            avgDailyScore: { $avg: '$wellnessScore' },
            avgFeelingScale: { $avg: '$feelingScale' },
            avgSleepQuality: { $avg: '$sleepQuality' },
            avgStressLevel: { $avg: '$stressLevel' },
            totalCheckins: { $sum: 1 },
            minDailyScore: { $min: '$wellnessScore' },
            maxDailyScore: { $max: '$wellnessScore' },
            moodFrequency: { $addToSet: '$mood' },
          },
        },
      ]);

      const dailyTrends = await DailyCheckinModel.find({
        userId,
        date: { $gte: startDate },
      })
        .select('date wellnessScore feelingScale sleepQuality stressLevel mood')
        .sort({ date: 1 });

      // Generate pattern insights
      const patternInsights = generatePatternInsights(dailyTrends, trends[0]);

      res.json({
        success: true,
        data: {
          summary: trends[0] || null,
          dailyTrends,
          patternInsights,
          period: `${days} days`,
        },
      });
    } catch (error) {
      console.error('Error in getWellnessTrends:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve wellness trends',
      });
    }
  },

  // Get correlation insights between different factors
  getCorrelationInsights: async (req, res) => {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const data = await DailyCheckinModel.find({
        userId,
        date: { $gte: startDate },
      }).select('feelingScale sleepQuality stressLevel wellnessScore date');

      const correlations = calculateCorrelations(data);

      res.json({
        success: true,
        data: {
          correlations,
          sampleSize: data.length,
          period: `${days} days`,
          note: 'These correlations show patterns in your data but do not imply causation',
        },
      });
    } catch (error) {
      console.error('Error in getCorrelationInsights:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve correlation insights',
      });
    }
  },
};

// Helper function to get recent trends
async function getRecentTrends(userId, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const recentData = await DailyCheckinModel.find({
    userId,
    date: { $gte: startDate },
  })
    .select('wellnessScore feelingScale sleepQuality stressLevel date')
    .sort({ date: -1 })
    .limit(days);

  if (recentData.length < 2) {
    return {
      message:
        'Not enough data to show trends yet. Keep tracking for a few more days!',
      dataPoints: recentData.length,
    };
  }

  const latest = recentData[0];
  const previous = recentData[1];

  return {
    scoreChange: latest.wellnessScore - previous.wellnessScore,
    feelingChange: latest.feelingScale - previous.feelingScale,
    sleepChange: latest.sleepQuality - previous.sleepQuality,
    stressChange: latest.stressLevel - previous.stressLevel,
    averageScore:
      recentData.reduce((sum, item) => sum + item.wellnessScore, 0) /
      recentData.length,
    dataPoints: recentData.length,
  };
}

// Save daily check-in to database
async function saveDailyCheckin(checkinData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyCheckin = new DailyCheckinModel({
    ...checkinData,
    date: today,
  });

  return await dailyCheckin.save();
}

// Enhanced validation function
function validateCheckInData(data) {
  const { feelingScale, sleepQuality, stressLevel, mood, userId } = data;

  if (!feelingScale || !sleepQuality || !stressLevel || !mood || !userId) {
    return 'Missing required fields: userId, feelingScale, sleepQuality, stressLevel, mood';
  }

  if (
    typeof feelingScale !== 'number' ||
    typeof sleepQuality !== 'number' ||
    typeof stressLevel !== 'number'
  ) {
    return 'feelingScale, sleepQuality, and stressLevel must be numbers';
  }

  if (typeof mood !== 'string' || typeof userId !== 'string') {
    return 'mood and userId must be strings';
  }

  if (feelingScale < 1 || feelingScale > 10) {
    return 'feelingScale must be between 1 and 10';
  }

  if (sleepQuality < 1 || sleepQuality > 10) {
    return 'sleepQuality must be between 1 and 10';
  }

  if (stressLevel < 1 || stressLevel > 10) {
    return 'stressLevel must be between 1 and 10';
  }

  const validMoods = [
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
    'stressed',
    'energetic',
    'relaxed',
    'tired',
    'joyful',
    'optimistic',
  ];

  if (!validMoods.includes(mood.toLowerCase())) {
    return `mood must be one of: ${validMoods.join(', ')}`;
  }

  return null;
}

// Calculate daily wellness score
function calculateDailyScore({ feelingScale, sleepQuality, stressLevel }) {
  // Invert stress level (higher stress = lower score)
  const invertedStress = 11 - stressLevel;

  // Weighted calculation:
  // Feeling scale: 40% weight
  // Sleep quality: 30% weight
  // Stress level: 30% weight
  const score = feelingScale * 0.4 + sleepQuality * 0.3 + invertedStress * 0.3;

  return Math.round(score * 10) / 10;
}

// Generate data insights instead of interpretations
function generateDataInsights(wellnessScore, metrics) {
  const insights = [];

  // Score range insights
  if (wellnessScore >= 8) {
    insights.push('Your daily score is in the higher range today');
  } else if (wellnessScore >= 6.5) {
    insights.push('Your daily score shows moderate positive levels');
  } else if (wellnessScore >= 5) {
    insights.push('Your daily score is in the middle range');
  } else {
    insights.push('Your daily score is in the lower range today');
  }

  // Component insights
  if (metrics.stressLevel >= 7) {
    insights.push('Your stress level reading is on the higher side');
  }

  if (metrics.sleepQuality <= 4) {
    insights.push('Your sleep quality rating is below 5');
  }

  if (metrics.feelingScale >= 7) {
    insights.push('Your feeling scale shows positive levels');
  }

  return {
    wellnessScore,
    scoreCalculation: {
      feelingScale: `${metrics.feelingScale}/10 (40% weight)`,
      sleepQuality: `${metrics.sleepQuality}/10 (30% weight)`,
      stressLevel: `${metrics.stressLevel}/10 (30% weight, inverted)`,
    },
    observations: insights,
    note: 'These are data observations, not medical assessments',
  };
}

// Generate supportive insights using AI
async function generateSupportiveInsights(data) {
  try {
    const {
      feelingScale,
      sleepQuality,
      stressLevel,
      mood,
      recentEvents,
      additionalNotes,
    } = data;

    const prompt = `You are a wellness data tracker. Analyze this daily check-in data and provide brief, neutral observations about patterns only.

    Data: Feeling ${feelingScale}/10, Sleep ${sleepQuality}/10, Stress ${stressLevel}/10, Mood: ${mood}${
      recentEvents ? `, Events: ${recentEvents}` : ''
    }${additionalNotes ? `, Notes: ${additionalNotes}` : ''}
    
    Provide: Pattern observations in 20-30 words. Encourage continued tracking. No advice or recommendations.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('Error generating supportive insights:', error);
    // return generateFallbackSupportiveResponse(data);
  }
}

// Fallback pattern response when AI is unavailable
function generateFallbackPatternResponse(data) {
  const { feelingScale, sleepQuality, stressLevel, mood } = data;

  let response = `Thank you for submitting your wellness data. Today's entry shows a ${mood} mood with a ${feelingScale}/10 feeling scale rating. `;

  if (stressLevel > 7) {
    response +=
      'Your stress level reading of ${stressLevel}/10 is in the higher range. ';
  }

  if (sleepQuality < 5) {
    response +=
      'Your sleep quality rating of ${sleepQuality}/10 falls below the midpoint. ';
  }

  if (feelingScale >= 7) {
    response += 'Your feeling scale reading indicates levels above 7/10. ';
  }

  response +=
    'Continuing to track these metrics over time will help identify patterns and trends in your personal data. This information is for your personal tracking and pattern recognition only.';

  return response;
}

// Generate encouraging response for quick mood tracking
function generateEncouragingResponse(mood, feelingScale) {
  if (feelingScale >= 7) {
    return `Thanks for tracking your ${mood} mood today! Your ${feelingScale}/10 feeling scale shows positive levels. Keep noting what contributes to these good days.`;
  } else if (feelingScale >= 4) {
    return `Thanks for sharing that you're feeling ${mood} with a ${feelingScale}/10 rating. Every data point helps you understand your patterns better.`;
  } else {
    return `Thank you for tracking your ${mood} feelings today. Your ${feelingScale}/10 rating is valuable data. Remember, all feelings are valid and tracking helps you understand your patterns.`;
  }
}

// Generate pattern insights from trends data
function generatePatternInsights(dailyTrends, summary) {
  const insights = [];

  if (!summary || dailyTrends.length < 3) {
    return ['Not enough data points to identify patterns yet. Keep tracking!'];
  }

  // Score trend analysis
  const recent = dailyTrends.slice(-3);
  const scores = recent.map((d) => d.wellnessScore);

  if (scores.every((score, i) => i === 0 || score >= scores[i - 1])) {
    insights.push(
      'Your daily scores show an upward trend over the last few days'
    );
  } else if (scores.every((score, i) => i === 0 || score <= scores[i - 1])) {
    insights.push('Your daily scores show a downward trend recently');
  }

  // Average comparisons
  if (summary.avgDailyScore >= 7) {
    insights.push('Your average daily score is in the higher range');
  } else if (summary.avgDailyScore <= 4) {
    insights.push('Your average daily score is in the lower range');
  }

  // Variability insights
  const scoreRange = summary.maxDailyScore - summary.minDailyScore;
  if (scoreRange > 4) {
    insights.push('Your daily scores show significant variation');
  } else if (scoreRange < 2) {
    insights.push('Your daily scores show consistent patterns');
  }

  // Sleep-stress correlation hint
  const sleepAvg = summary.avgSleepQuality;
  const stressAvg = summary.avgStressLevel;

  if (sleepAvg < 5 && stressAvg > 6) {
    insights.push(
      'Your data shows both lower sleep quality and higher stress levels'
    );
  }

  return insights.length > 0
    ? insights
    : ['Continue tracking to reveal more patterns in your data'];
}

// Calculate correlations between different factors
function calculateCorrelations(data) {
  if (data.length < 5) {
    return {
      message: 'Need more data points to calculate meaningful correlations',
      minimumRequired: 5,
      currentCount: data.length,
    };
  }

  const correlations = {};

  // Simple correlation calculations
  correlations.sleepVsFeeling = calculateSimpleCorrelation(
    data.map((d) => d.sleepQuality),
    data.map((d) => d.feelingScale)
  );

  correlations.stressVsFeeling = calculateSimpleCorrelation(
    data.map((d) => d.stressLevel),
    data.map((d) => d.feelingScale)
  );

  correlations.sleepVsStress = calculateSimpleCorrelation(
    data.map((d) => d.sleepQuality),
    data.map((d) => d.stressLevel)
  );

  return {
    correlations,
    interpretation: {
      sleepVsFeeling: interpretCorrelation(
        correlations.sleepVsFeeling,
        'sleep quality',
        'feeling scale'
      ),
      stressVsFeeling: interpretCorrelation(
        correlations.stressVsFeeling,
        'stress level',
        'feeling scale'
      ),
      sleepVsStress: interpretCorrelation(
        correlations.sleepVsStress,
        'sleep quality',
        'stress level'
      ),
    },
    sampleSize: data.length,
  };
}

// Calculate simple correlation coefficient
function calculateSimpleCorrelation(x, y) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
}

// Interpret correlation values
function interpretCorrelation(correlation, factor1, factor2) {
  const absCorr = Math.abs(correlation);
  const direction = correlation > 0 ? 'positive' : 'negative';

  let strength;
  if (absCorr > 0.7) strength = 'strong';
  else if (absCorr > 0.4) strength = 'moderate';
  else if (absCorr > 0.2) strength = 'weak';
  else strength = 'very weak';

  return `${strength} ${direction} correlation between ${factor1} and ${factor2} (${correlation.toFixed(
    2
  )})`;
}

module.exports = checkinController;
