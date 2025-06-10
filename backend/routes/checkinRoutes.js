const express = require('express');
const router = express.Router();

// Example controller functions - replace with your actual logic
const mentalHealthController = {
  // Full mental health analysis
  analyzeMentalHealth: async (req, res) => {
    try {
      // Validate input
      const {
        feelingScale,
        sleepQuality,
        stressLevel,
        mood,
        recentEvents,
        additionalNotes,
      } = req.body;

      // Basic validation
      if (!feelingScale || !sleepQuality || !stressLevel || !mood) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['feelingScale', 'sleepQuality', 'stressLevel', 'mood'],
        });
      }

      // Validate ranges
      if (feelingScale < 1 || feelingScale > 10) {
        return res.status(400).json({
          error: 'feelingScale must be between 1 and 10',
        });
      }

      if (sleepQuality < 1 || sleepQuality > 10) {
        return res.status(400).json({
          error: 'sleepQuality must be between 1 and 10',
        });
      }

      if (stressLevel < 1 || stressLevel > 10) {
        return res.status(400).json({
          error: 'stressLevel must be between 1 and 10',
        });
      }

      // Calculate wellness score (simple algorithm)
      const wellnessScore = Math.round(
        (feelingScale + sleepQuality + (11 - stressLevel)) / 3
      );

      // Generate interpretation
      let scoreInterpretation;
      if (wellnessScore >= 8) {
        scoreInterpretation = 'Excellent mental wellness';
      } else if (wellnessScore >= 6) {
        scoreInterpretation = 'Good mental wellness';
      } else if (wellnessScore >= 4) {
        scoreInterpretation = 'Fair mental wellness - consider self-care';
      } else {
        scoreInterpretation =
          'Poor mental wellness - consider professional support';
      }

      // Generate AI response (you can replace this with actual Gemini API call)
      const aiResponse = generateMockAIResponse(req.body);

      res.json({
        success: true,
        analysis: {
          wellnessScore,
          scoreInterpretation,
          aiResponse,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error in analyzeMentalHealth:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to analyze mental health data',
      });
    }
  },

  // Quick mood check
  quickMoodCheck: async (req, res) => {
    try {
      const { mood, feelingScale } = req.body;

      if (!mood || !feelingScale) {
        return res.status(400).json({
          error: 'Missing required fields: mood and feelingScale',
        });
      }

      if (feelingScale < 1 || feelingScale > 10) {
        return res.status(400).json({
          error: 'feelingScale must be between 1 and 10',
        });
      }

      // Generate quick response
      let quickResponse;
      if (feelingScale >= 7) {
        quickResponse = `Great to hear you're feeling ${mood}! Keep up the positive energy.`;
      } else if (feelingScale >= 4) {
        quickResponse = `Thanks for sharing that you're feeling ${mood}. Remember to take care of yourself.`;
      } else {
        quickResponse = `I understand you're feeling ${mood}. Consider reaching out to someone you trust or practicing some self-care.`;
      }

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
        error: 'Internal server error',
        message: 'Failed to process mood check',
      });
    }
  },
};

// Helper function to generate mock AI response
function generateMockAIResponse(data) {
  const {
    feelingScale,
    sleepQuality,
    stressLevel,
    mood,
    recentEvents,
    additionalNotes,
  } = data;

  let response = `Based on your mental health check-in, I can see you're feeling ${mood} with a feeling scale of ${feelingScale}/10. `;

  if (stressLevel > 7) {
    response +=
      'Your stress level seems quite high. Consider practicing relaxation techniques like deep breathing or meditation. ';
  }

  if (sleepQuality < 5) {
    response +=
      'Your sleep quality could use improvement. Try establishing a consistent bedtime routine. ';
  }

  if (recentEvents) {
    response += `I notice you mentioned: "${recentEvents}". These experiences can definitely impact how we feel. `;
  }

  response +=
    "Remember that it's normal to have ups and downs. If you continue to feel overwhelmed, don't hesitate to reach out to a mental health professional.";

  return response;
}

// Routes
router.post('/analyze', mentalHealthController.analyzeMentalHealth);
router.post('/mood-check', mentalHealthController.quickMoodCheck);

// Health check for the mental health API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Mental Health Routes',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
