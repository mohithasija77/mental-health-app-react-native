const { GoogleGenerativeAI } = require('@google/generative-ai');
const { DailyCheckinModel } = require('../models/DailyCheckinModel'); // Adjust path as needed

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const checkinController = {
  // Main mental health analysis endpoint
  analyzeMentalHealth: async (req, res) => {
    try {
      console.log('Mental health analysis request:', req.body);

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

      // Validate required fields (including userId for database storage)
      const validationError = validateCheckInData({
        ...req.body,
        userId,
      });
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError,
        });
      }

      // Calculate wellness score
      const wellnessScore = calculateWellnessScore({
        feelingScale,
        sleepQuality,
        stressLevel,
      });

      // Generate score interpretation
      const scoreInterpretation = getScoreInterpretation(wellnessScore);

      // Generate AI analysis using Gemini
      const aiAnalysis = await generateAIAnalysis(req.body);

      // Save to database
      const dailyCheckin = await saveDailyCheckin({
        userId,
        wellnessScore,
        feelingScale,
        sleepQuality,
        stressLevel,
        mood,
        activities,
        notes: additionalNotes,
      });

      // Prepare response
      const response = {
        success: true,
        analysis: {
          wellnessScore,
          scoreInterpretation,
          aiResponse: aiAnalysis,
          summary: {
            feelingScale,
            sleepQuality,
            stressLevel,
            mood,
          },
          timestamp: new Date().toISOString(),
          checkinId: dailyCheckin._id,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in analyzeMentalHealth:', error);

      // Handle specific Gemini API errors
      if (error.message?.includes('API key')) {
        return res.status(500).json({
          success: false,
          error: 'AI service configuration error',
          message: 'Unable to connect to AI analysis service',
        });
      }

      // Handle database errors
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate entry',
          message: 'You have already submitted a check-in for today',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to analyze mental health data',
      });
    }
  },

  // Quick mood check endpoint (optional - for simpler interactions)
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

      const quickResponse = generateQuickResponse(mood, feelingScale);

      res.json({
        success: true,
        mood,
        feelingScale,
        quickResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in quickMoodCheck:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process mood check',
      });
    }
  },

  // Get user's check-in history
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

  // Get wellness trends/analytics
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

      const trends = await DailyCheckin.aggregate([
        {
          $match: {
            userId,
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: null,
            avgWellnessScore: { $avg: '$wellnessScore' },
            avgFeelingScale: { $avg: '$feelingScale' },
            avgSleepQuality: { $avg: '$sleepQuality' },
            avgStressLevel: { $avg: '$stressLevel' },
            totalCheckins: { $sum: 1 },
            mostCommonMood: { $first: '$mood' }, // This is simplified
          },
        },
      ]);

      const dailyTrends = await DailyCheckin.find({
        userId,
        date: { $gte: startDate },
      })
        .select('date wellnessScore feelingScale sleepQuality stressLevel')
        .sort({ date: 1 });

      res.json({
        success: true,
        data: {
          summary: trends[0] || null,
          dailyTrends,
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
};

// Save daily check-in to database
async function saveDailyCheckin(checkinData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  const dailyCheckin = new DailyCheckinModel({
    ...checkinData,
    date: today,
  });

  return await dailyCheckin.save();
}

// Enhanced validation function
function validateCheckInData(data) {
  const { feelingScale, sleepQuality, stressLevel, mood, userId } = data;

  // Check required fields
  if (!feelingScale || !sleepQuality || !stressLevel || !mood || !userId) {
    return 'Missing required fields: userId, feelingScale, sleepQuality, stressLevel, mood';
  }

  // Validate data types
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

  // Validate ranges
  if (feelingScale < 1 || feelingScale > 10) {
    return 'feelingScale must be between 1 and 10';
  }

  if (sleepQuality < 1 || sleepQuality > 10) {
    return 'sleepQuality must be between 1 and 10';
  }

  if (stressLevel < 1 || stressLevel > 10) {
    return 'stressLevel must be between 1 and 10';
  }

  // Validate mood enum
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
  ];

  if (!validMoods.includes(mood.toLowerCase())) {
    return `mood must be one of: ${validMoods.join(', ')}`;
  }

  return null; // No validation errors
}

// Calculate wellness score
function calculateWellnessScore({ feelingScale, sleepQuality, stressLevel }) {
  // Invert stress level (higher stress = lower wellness)
  const invertedStress = 11 - stressLevel;

  // Calculate weighted average
  const score = feelingScale * 0.4 + sleepQuality * 0.3 + invertedStress * 0.3;

  return Math.round(score * 10) / 10; // Round to 1 decimal place
}

// Generate score interpretation
function getScoreInterpretation(score) {
  if (score >= 8) {
    return "Excellent mental wellness - You're doing great!";
  } else if (score >= 6.5) {
    return 'Good mental wellness - Keep up the positive habits';
  } else if (score >= 5) {
    return 'Fair mental wellness - Consider some self-care activities';
  } else if (score >= 3.5) {
    return 'Below average wellness - It might help to focus on stress management';
  } else {
    return 'Poor mental wellness - Consider reaching out for professional support';
  }
}

// Generate AI analysis using Gemini (UPDATED WITH CORRECT MODEL NAME)
async function generateAIAnalysis(data) {
  try {
    const {
      feelingScale,
      sleepQuality,
      stressLevel,
      mood,
      recentEvents,
      additionalNotes,
    } = data;

    const prompt = `
You are a compassionate mental health assistant. Analyze this mental health check-in and provide supportive, helpful insights.

Mental Health Data:
- Current feeling scale: ${feelingScale}/10
- Sleep quality: ${sleepQuality}/10  
- Stress level: ${stressLevel}/10
- Current mood: ${mood}
- Recent events: ${recentEvents || 'None mentioned'}
- Additional notes: ${additionalNotes || 'None'}

Please provide:
1. A warm, empathetic acknowledgment of their current state
2. Specific, actionable suggestions based on their data
3. Encouragement and positive reinforcement
4. When appropriate, gentle suggestions for professional help

Keep the response supportive, non-judgmental, and around 150-200 words. Focus on practical advice they can implement today.
`;

    // Updated model name - using Gemini 1.5 Flash (most stable and widely available)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('Error generating AI analysis:', error);

    // Fallback response if AI fails
    return generateFallbackResponse(data);
  }
}

// Fallback response when AI is unavailable
function generateFallbackResponse(data) {
  const { feelingScale, sleepQuality, stressLevel, mood, recentEvents } = data;

  let response = `Thank you for sharing how you're feeling today. I can see you're experiencing ${mood} feelings with a ${feelingScale}/10 on your feeling scale. `;

  if (stressLevel > 7) {
    response +=
      'Your stress levels seem quite high right now. Consider trying some deep breathing exercises or taking a short walk to help manage these feelings. ';
  }

  if (sleepQuality < 5) {
    response +=
      'Your sleep quality could use some attention. Good sleep is crucial for mental wellness - try setting a consistent bedtime routine. ';
  }

  if (feelingScale >= 7) {
    response +=
      "It's wonderful that you're feeling relatively positive today. Keep nurturing the activities and thoughts that contribute to this state. ";
  }

  if (recentEvents) {
    response +=
      "The recent events you mentioned can certainly impact how we feel. Remember that it's normal to have emotional responses to life changes. ";
  }

  response +=
    "Remember to be kind to yourself and don't hesitate to reach out to friends, family, or a mental health professional if you need additional support.";

  return response;
}

// Generate quick response for mood check
function generateQuickResponse(mood, feelingScale) {
  if (feelingScale >= 7) {
    return `It's great to hear you're feeling ${mood} today! Your positive energy is showing with a ${feelingScale}/10 feeling scale. Keep nurturing what's working for you.`;
  } else if (feelingScale >= 4) {
    return `Thanks for sharing that you're feeling ${mood}. A ${feelingScale}/10 suggests you're managing okay, but remember to take care of yourself and practice some self-compassion.`;
  } else {
    return `I understand you're feeling ${mood} and rating yourself at ${feelingScale}/10. These feelings are valid, and it's okay to have difficult days. Consider reaching out to someone you trust or trying a small self-care activity.`;
  }
}

module.exports = checkinController;
