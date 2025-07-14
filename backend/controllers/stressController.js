// File: controllers/stressController.js

const Stress = require('../models/Stress');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeStress = async (req, res) => {
  console.log(req.body);
  try {
    const {
      answers,
      userId,
      userName = 'User',
      userAge = 'Not specified',
    } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'userId is required' });
    }
    if (!answers || Object.keys(answers).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Answers are required' });
    }

    const stressScore = calculateStressScore(answers);
    const stressLevel = getStressLevel(stressScore);
    const analysisPrompt = createAnalysisPrompt(answers, stressScore, {
      name: userName,
      age: userAge,
    });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(analysisPrompt);
    const aiAnalysis = result.response.text();
    const parsedAnalysis = parseAIAnalysis(aiAnalysis);

    const stressAnalysis = new Stress({
      userId,
      answers,
      stressScore,
      stressLevel,
      analysis: parsedAnalysis.summary,
      recommendations: parsedAnalysis.recommendations,
      createdAt: new Date(),
    });

    await stressAnalysis.save();

    res.status(200).json({
      success: true,
      analysis: {
        stressLevel: stressScore,
        level: stressLevel,
        summary: parsedAnalysis.summary,
        recommendations: parsedAnalysis.recommendations,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Stress analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze stress levels',
      error: error.message,
    });
  }
};

const calculateStressScore = (answers) => {
  const weights = {
    1: 0.2,
    2: 0.15,
    3: 0.1,
    4: 0.2,
    5: 0.15,
    6: 0.1,
    7: 0.05,
    8: 0.05,
  };
  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(answers).forEach(([qId, answer]) => {
    const weight = weights[parseInt(qId)] || 0;
    let normalized = answer;
    if (qId === '3' || qId === '7') normalized = Math.ceil(answer / 2);
    totalScore += normalized * weight;
    totalWeight += weight;
  });

  const avgScore = totalScore / totalWeight;
  return Math.round(avgScore * 2); // scale to 1–10
};

const getStressLevel = (score) => {
  if (score <= 2) return 'Very Low';
  if (score <= 4) return 'Low';
  if (score <= 6) return 'Moderate';
  if (score <= 8) return 'High';
  return 'Very High';
};

const createAnalysisPrompt = (answers, stressScore, user) => {
  const questionMappings = {
    1: 'Overall feeling',
    2: 'Sleep quality',
    3: 'Energy level',
    4: 'Overwhelm level',
    5: 'Focus ability',
    6: 'Relationship quality',
    7: 'Physical comfort',
    8: 'Appetite',
  };

  let answersText = '';
  Object.entries(answers).forEach(([qId, ans]) => {
    const q = questionMappings[qId];
    answersText += `${q}: ${ans}\n`;
  });

  return `
    You are a compassionate mental health assistant analyzing stress levels.

    User Profile:
    - Name: ${user.name}
    - Age: ${user.age}

    Stress Score: ${stressScore}/10

    Responses:
    ${answersText}

    Provide JSON only:
    {
      "summary": "Warm, empathetic 3-4 sentence summary",
      "recommendations": [
        "Actionable tip 1",
        "Actionable tip 2",
        "Actionable tip 3"
      ]
    }
  `;
};

const parseAIAnalysis = (aiResponse) => {
  try {
    const cleaned = aiResponse.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || 'Analysis completed.',
      recommendations: parsed.recommendations || [],
    };
  } catch (err) {
    console.error('Parse AI analysis error:', err);
    return {
      summary: 'Thank you for completing the assessment.',
      recommendations: [
        'Practice deep breathing',
        'Maintain a sleep schedule',
        'Take short breaks',
        'Talk to supportive people',
      ],
    };
  }
};

// keep other functions if you need them:
const getStressHistory = async (req, res) => {
  /* unchanged */
};
const getStressInsights = async (req, res) => {
  /* unchanged */
};

module.exports = {
  analyzeStress,
  getStressHistory,
  getStressInsights,
};
