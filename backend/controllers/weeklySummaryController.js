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
      const { userId, weekStartDate } = req.body;

      if (!userId || !weekStartDate) {
        return res.status(400).json({
          success: false,
          error: 'userId and weekStartDate are required',
        });
      }

      // Step 1: Define week boundaries
      const startOfWeek = new Date(weekStartDate);
      startOfWeek.setHours(0, 0, 0, 0); // normalize to midnight
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      console.log('📅 Fetching data from:', startOfWeek, 'to', endOfWeek);

      // Step 2: Get current week's check-in data
      const weeklyData = await DailyCheckinModel.find({
        userId,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      }).sort({ createdAt: 1 });

      console.log(`✅ Found ${weeklyData.length} check-in(s)`);

      // Step 3: Check if summary exists (always use normalized startOfWeek)
      let existingSummary = await WeeklySummary.findOne({
        userId,
        weekStartDate: startOfWeek,
      });

      let needsUpdate = false;

      if (existingSummary) {
        // Compare data counts
        const currentDataCount = weeklyData.length;
        const savedDataCount = existingSummary.dailyCheckinIds
          ? existingSummary.dailyCheckinIds.length
          : 0;

        if (currentDataCount !== savedDataCount) {
          console.log(
            `📊 Data count changed: ${savedDataCount} → ${currentDataCount}. Updating summary...`
          );
          needsUpdate = true;
        } else {
          // Check if there are newer entries since last update
          const lastSummaryUpdate = existingSummary.lastUpdated;
          const hasNewerEntries = weeklyData.some(
            (entry) =>
              entry.updatedAt > lastSummaryUpdate ||
              entry.createdAt > lastSummaryUpdate
          );

          if (hasNewerEntries) {
            console.log('📊 Found newer entries. Updating summary...');
            needsUpdate = true;
          }
        }

        if (!needsUpdate) {
          console.log('✅ Returning existing weekly summary from DB');
          return res.json({
            success: true,
            weeklySummary: {
              ...existingSummary.summary,
              timestamp: existingSummary.lastUpdated,
            },
          });
        }
      }

      // Step 4: Handle empty data
      if (weeklyData.length === 0) {
        if (existingSummary) {
          await WeeklySummary.findByIdAndDelete(existingSummary._id);
          console.log('🗑️ Deleted existing empty weekly summary');
        }

        return res.json({
          success: true,
          weeklySummary: {
            period: {
              totalDays: 0,
              startDate: startOfWeek,
              endDate: endOfWeek,
              dataRange: 'No check-ins in this week',
            },
            averages: {},
            trends: {},
            insights: {
              aiSummary: 'No data this week to generate insights.',
              keyPatterns: [],
              recommendations: [],
            },
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Step 5: Compute analytics & AI insights
      console.log(`📊 Computing analytics for ${weeklyData.length} entries...`);
      const analytics = calculateWeeklyAnalytics(weeklyData);
      const aiInsights = await generateWeeklyAIInsights(weeklyData, analytics);

      const summaryData = {
        period: {
          totalDays: weeklyData.length,
          dataRange: `${weeklyData.length} check-in(s)`,
          startDate: startOfWeek,
          endDate: endOfWeek,
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

      const dailyCheckinIds = weeklyData.map((d) => d._id);

      // Step 6: Save or update summary (Fixed to handle race conditions)
      try {
        const savedSummary = await WeeklySummary.findOneAndUpdate(
          {
            userId,
            weekStartDate: startOfWeek,
          },
          {
            userId,
            weekStartDate: startOfWeek,
            weekEndDate: endOfWeek,
            summary: summaryData,
            dailyCheckinIds: dailyCheckinIds,
            lastUpdated: new Date(),
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

        const action = existingSummary ? 'Updated' : 'Created';
        console.log(`✅ ${action} weekly summary`);

        return res.json({
          success: true,
          weeklySummary: {
            ...summaryData,
            timestamp: savedSummary.lastUpdated,
          },
        });
      } catch (updateError) {
        // Handle duplicate key error specifically
        if (updateError.code === 11000) {
          console.log(
            '🔄 Duplicate key detected, retrying with update only...'
          );

          // Retry with update only (no upsert)
          const updatedSummary = await WeeklySummary.findOneAndUpdate(
            {
              userId,
              weekStartDate: startOfWeek,
            },
            {
              weekEndDate: endOfWeek,
              summary: summaryData,
              dailyCheckinIds: dailyCheckinIds,
              lastUpdated: new Date(),
            },
            { new: true }
          );

          if (updatedSummary) {
            console.log('✅ Updated weekly summary after retry');
            return res.json({
              success: true,
              weeklySummary: {
                ...summaryData,
                timestamp: updatedSummary.lastUpdated,
              },
            });
          } else {
            throw new Error('Failed to update existing summary');
          }
        }

        throw updateError; // Re-throw other errors
      }
    } catch (error) {
      console.error('❌ Error generating weekly summary:', error);
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

  // Key patterns
  const keyPatterns = [];
  if (avgStressLevel > 7)
    keyPatterns.push('High stress levels throughout the week');
  if (avgSleepQuality < 5)
    keyPatterns.push('Poor sleep quality affecting wellness');
  if (avgWellnessScore > 7) keyPatterns.push('Strong overall mental wellness');

  return {
    startDate: weeklyData[0]?.date || new Date().toISOString(),
    endDate: weeklyData[totalDays - 1]?.date || new Date().toISOString(),
    totalDays,
    avgWellnessScore,
    avgFeelingScale,
    avgSleepQuality,
    avgStressLevel,
    moodFrequency,
    bestDay,
    challengingDay,
    keyPatterns,
  };
}
// Generate AI insights for weekly summary (same as before)
async function generateWeeklyAIInsights(weeklyData, analytics) {
  try {
    const prompt = `
    Analyze this weekly mental health data and output exactly:
    Line 1: Key trends and patterns in 50 words. No numbering, no markdown, no extra commentary.
    < 1 line space/gap inbetween >
    Line 2: The wellness trend in one word (improving, declining, stable, or mixed). 
       Output exactly in this format: Weekly Trend: <OneWord>
    
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
    
    Exclude recommendations or motivational text. Focus only on noticeable patterns and trends.
    Return only the two lines with small gap inbetween as specified.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

// Fallback weekly insights (trends and patterns only)
function generateFallbackWeeklyInsights(analytics) {
  let insights = `Your average wellness score this week was ${analytics.avgWellnessScore}/10. `;

  if (analytics.avgStressLevel) {
    insights += `Your average stress level was ${analytics.avgStressLevel}/10. `;
  }

  if (analytics.avgSleepQuality) {
    insights += `Your average sleep quality was ${analytics.avgSleepQuality}/10. `;
  }

  return insights;
}
module.exports = weeklySummaryController;
