const { GoogleGenerativeAI } = require('@google/generative-ai');
const { DailyCheckinModel } = require('../models/DailyCheckinModel');
const { WeeklySummary } = require('../models/weeklySummaryModel');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const weeklySummaryController = {
  // Save daily check-in
  saveDailyCheckin: async (req, res) => {
    try {
      const {
        userId,
        wellnessScore,
        feelingScale,
        mood,
        sleepQuality,
        stressLevel,
        activities,
        notes,
      } = req.body;

      // Validation
      if (
        !userId ||
        !wellnessScore ||
        !feelingScale ||
        !mood ||
        !sleepQuality ||
        !stressLevel
      ) {
        return res.status(400).json({
          success: false,
          error: 'All required fields must be provided',
        });
      }

      // Create or update daily check-in for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyCheckin = await DailyCheckinModel.findOneAndUpdate(
        { userId, date: today },
        {
          wellnessScore,
          feelingScale,
          mood,
          sleepQuality,
          stressLevel,
          activities: activities || [],
          notes: notes || '',
          timestamp: new Date(),
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        checkin: dailyCheckin,
      });
    } catch (error) {
      console.error('Error saving daily check-in:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save daily check-in',
        message: error.message,
      });
    }
  },

  // Get weekly data from MongoDB
  getWeeklyData: async (req, res) => {
    try {
      const { startDate, endDate } = req.params;
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      const weeklyData =
        (await DailyCheckinModel.find({
          userId,
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        }).sort({ date: 1 })) || [];

      res.json({
        success: true,
        weeklyData,
      });
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch weekly data',
        message: error.message,
      });
    }
  },

  // Generate weekly mental health summary
  generateWeeklySummary: async (req, res) => {
    try {
      const { userId } = req.body;
      console.log(req.body);

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required',
        });
      }

      // Get the last 7 daily check-ins from MongoDB (or all available)
      const weeklyData = await DailyCheckinModel.find({
        userId,
      })
        .sort({ createdAt: -1 }) // Sort by most recent first
        .limit(7); // Get last 7 entries

      if (weeklyData.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No data found for this user',
        });
      }

      // Reverse to get chronological order for analysis
      weeklyData.reverse();

      // Calculate weekly analytics
      const analytics = calculateWeeklyAnalytics(weeklyData);

      // Generate AI insights
      const aiInsights = await generateWeeklyAIInsights(weeklyData, analytics);

      // Prepare summary object
      const summaryData = {
        period: {
          totalDays: weeklyData.length,
          dataRange: `${weeklyData.length} most recent check-ins`,
        },
        averages: {
          wellnessScore: analytics.avgWellnessScore,
          feelingScale: analytics.avgFeelingScale,
          sleepQuality: analytics.avgSleepQuality,
          stressLevel: analytics.avgStressLevel,
        },
        trends: {
          moodFrequency: analytics.moodFrequency,
          wellnessScoreTrend: analytics.wellnessScoreTrend,
          bestDay: analytics.bestDay,
          challengingDay: analytics.challengingDay,
        },
        insights: {
          aiSummary: aiInsights,
          keyPatterns: analytics.keyPatterns,
          recommendations: analytics.recommendations,
        },
      };

      // Save or update weekly summary (using userId as identifier)
      const weeklySummary = await WeeklySummary.findOneAndUpdate(
        { userId },
        {
          summary: summaryData,
          dailyCheckinIds: weeklyData.map((day) => day._id),
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );

      // Prepare response
      const response = {
        success: true,
        weeklySummary: {
          ...summaryData,
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate weekly summary',
        message: error.message,
      });
    }
  },
  // Quick mood check endpoint
  quickMoodCheck: async (req, res) => {
    try {
      const { mood, intensity, trigger, needsSupport } = req.body;

      // Validate required fields
      if (!mood || !intensity) {
        return res.status(400).json({
          success: false,
          error: 'Mood and intensity are required',
        });
      }

      if (intensity < 1 || intensity > 10) {
        return res.status(400).json({
          success: false,
          error: 'Intensity must be between 1 and 10',
        });
      }

      // Generate quick response
      const quickResponse = generateQuickMoodResponse(
        mood,
        intensity,
        trigger,
        needsSupport
      );

      // Determine if immediate support is needed
      const needsImmediateAttention =
        (intensity <= 3 &&
          ['sad', 'hopeless', 'overwhelmed', 'anxious'].includes(
            mood.toLowerCase()
          )) ||
        needsSupport;

      const response = {
        success: true,
        moodCheck: {
          mood,
          intensity,
          trigger: trigger || null,
          needsSupport: needsSupport || false,
          response: quickResponse,
          needsImmediateAttention,
          timestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in quick mood check:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process mood check',
        message: error.message,
      });
    }
  },
};

// Calculate weekly analytics (same as before)
function calculateWeeklyAnalytics(weeklyData) {
  // Add safety check
  if (!weeklyData || !Array.isArray(weeklyData) || weeklyData.length === 0) {
    console.error('Invalid weeklyData:', weeklyData);
    throw new Error('No valid weekly data provided');
  }

  const totalDays = weeklyData.length;

  // Calculate averages with safety checks
  const avgWellnessScore =
    Math.round(
      (weeklyData.reduce((sum, day) => sum + (day.wellnessScore || 0), 0) /
        totalDays) *
        10
    ) / 10;

  const avgFeelingScale =
    Math.round(
      (weeklyData.reduce((sum, day) => sum + (day.feelingScale || 0), 0) /
        totalDays) *
        10
    ) / 10;

  const avgSleepQuality =
    Math.round(
      (weeklyData.reduce((sum, day) => sum + (day.sleepQuality || 0), 0) /
        totalDays) *
        10
    ) / 10;

  const avgStressLevel =
    Math.round(
      (weeklyData.reduce((sum, day) => sum + (day.stressLevel || 0), 0) /
        totalDays) *
        10
    ) / 10;

  // Mood frequency analysis with safety check
  const moodFrequency = {};
  weeklyData.forEach((day) => {
    if (day.mood) {
      moodFrequency[day.mood] = (moodFrequency[day.mood] || 0) + 1;
    }
  });

  // Find best and most challenging days with proper initial values
  const bestDay = weeklyData.reduce((best, day) => {
    if (!best || (day.wellnessScore || 0) > (best.wellnessScore || 0)) {
      return day;
    }
    return best;
  }, null);

  const challengingDay = weeklyData.reduce((worst, day) => {
    if (!worst || (day.wellnessScore || 10) < (worst.wellnessScore || 10)) {
      return day;
    }
    return worst;
  }, null);

  // Determine wellness score trend with safety checks
  const firstHalf = weeklyData.slice(0, Math.ceil(totalDays / 2));
  const secondHalf = weeklyData.slice(Math.ceil(totalDays / 2));

  const firstHalfAvg =
    firstHalf.reduce((sum, day) => sum + (day.wellnessScore || 0), 0) /
    firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, day) => sum + (day.wellnessScore || 0), 0) /
    secondHalf.length;

  let wellnessScoreTrend = 'stable';
  if (secondHalfAvg > firstHalfAvg + 0.5) wellnessScoreTrend = 'improving';
  else if (secondHalfAvg < firstHalfAvg - 0.5) wellnessScoreTrend = 'declining';

  // Key patterns
  const keyPatterns = [];
  if (avgStressLevel > 7)
    keyPatterns.push('High stress levels throughout the week');
  if (avgSleepQuality < 5)
    keyPatterns.push('Poor sleep quality affecting wellness');
  if (avgWellnessScore > 7) keyPatterns.push('Strong overall mental wellness');

  // Basic recommendations
  const recommendations = [];
  if (avgStressLevel > 6)
    recommendations.push('Consider stress management techniques');
  if (avgSleepQuality < 6)
    recommendations.push('Focus on improving sleep hygiene');
  if (wellnessScoreTrend === 'declining')
    recommendations.push(
      'Monitor mood patterns and consider additional support'
    );

  return {
    startDate: weeklyData[0]?.date || new Date().toISOString(),
    endDate: weeklyData[totalDays - 1]?.date || new Date().toISOString(),
    totalDays,
    avgWellnessScore,
    avgFeelingScale,
    avgSleepQuality,
    avgStressLevel,
    moodFrequency,
    wellnessScoreTrend,
    bestDay,
    challengingDay,
    keyPatterns,
    recommendations,
  };
}
// Generate AI insights for weekly summary (same as before)
async function generateWeeklyAIInsights(weeklyData, analytics) {
  try {
    const prompt = `
Analyze this weekly mental health data and provide compassionate, actionable insights:

Weekly Overview:
- Average wellness score: ${analytics.avgWellnessScore}/10
- Average feeling scale: ${analytics.avgFeelingScale}/10
- Average sleep quality: ${analytics.avgSleepQuality}/10
- Average stress level: ${analytics.avgStressLevel}/10
- Wellness trend: ${analytics.wellnessScoreTrend}
- Most common moods: ${Object.keys(analytics.moodFrequency).join(', ')}

Daily Data:
${weeklyData
  .map(
    (day, index) =>
      `Day ${index + 1}: Wellness ${day.wellnessScore}/10, Mood: ${
        day.mood
      }, Sleep: ${day.sleepQuality}/10, Stress: ${day.stressLevel}/10`
  )
  .join('\n')}

Provide:
1. A warm acknowledgment of their week
2. 2-3 key insights about patterns
3. 2-3 specific, actionable recommendations
4. Encouragement and positive reinforcement

Keep response supportive and around 200 words.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return generateFallbackWeeklyInsights(analytics);
  }
}

// Generate quick mood response (same as before)
function generateQuickMoodResponse(mood, intensity, trigger, needsSupport) {
  let response = `Thank you for checking in. I see you're feeling ${mood} at a ${intensity}/10 intensity. `;

  if (trigger) {
    response += `It sounds like ${trigger} might be influencing how you're feeling right now. `;
  }

  if (intensity >= 7) {
    response +=
      "It's wonderful that you're experiencing positive emotions! Try to savor this moment.";
  } else if (intensity >= 4) {
    response +=
      "You're navigating through some mixed feelings, which is completely normal. Be gentle with yourself.";
  } else {
    response +=
      "I can see you're having a difficult time right now. Your feelings are valid, and it's okay to reach out for support.";
  }

  if (needsSupport) {
    response +=
      " Since you've indicated you need support, consider talking to a trusted friend, family member, or mental health professional.";
  }

  return response;
}

// Fallback weekly insights (same as before)
function generateFallbackWeeklyInsights(analytics) {
  let insights = `Looking at your week, your average wellness score was ${analytics.avgWellnessScore}/10. `;

  if (analytics.wellnessScoreTrend === 'improving') {
    insights += "I'm pleased to see your wellness trending upward this week! ";
  } else if (analytics.wellnessScoreTrend === 'declining') {
    insights +=
      "I notice your wellness has been declining this week. This is a normal part of life's ups and downs. ";
  }

  if (analytics.avgStressLevel > 6) {
    insights +=
      'Your stress levels have been elevated. Consider incorporating stress-reduction activities into your daily routine. ';
  }

  if (analytics.avgSleepQuality < 6) {
    insights +=
      'Your sleep quality could benefit from attention, as good sleep is foundational to mental wellness. ';
  }

  insights +=
    'Remember that mental health is a journey, and every small step toward self-care matters.';

  return insights;
}

module.exports = weeklySummaryController;
