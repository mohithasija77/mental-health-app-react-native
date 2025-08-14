// File: controllers/stressController.js

const Stress = require('../models/Stress');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Weights for each question (sum not required; we normalize by totalWeight).
 * Adjust weights if you want certain questions to matter more.
 */
const WEIGHTS = {
  1: 0.2,
  2: 0.15,
  3: 0.1,
  4: 0.2,
  5: 0.15,
  6: 0.1,
  7: 0.05,
  8: 0.05,
};

/**
 * Human-readable label maps copied from the frontend (so AI sees text, not numbers).
 */
const LABELS = {
  1: { 1: 'Amazing', 2: 'Good', 3: 'Okay', 4: 'Not great', 5: 'Terrible' },
  2: {
    1: 'Like a baby',
    2: 'Pretty well',
    3: 'Okay',
    4: 'Restless',
    5: 'Barely slept',
  },
  // 3 is slider 1-10 -> we'll display as "X/10"
  4: { 1: 'Zen', 2: 'Calm', 3: 'Balanced', 4: 'Stressed', 5: 'Overwhelmed' },
  5: {
    1: 'Laser focused',
    2: 'Pretty good',
    3: 'Average',
    4: 'Distracted',
    5: "Can't focus",
  },
  6: { 1: 'Loving', 2: 'Good', 3: 'Neutral', 4: 'Tense', 5: 'Difficult' },
  // 7 is slider 1-10 -> display "X/10"
  8: {
    1: 'Great appetite',
    2: 'Normal',
    3: 'Okay',
    4: 'Poor appetite',
    5: 'No appetite',
  },
};

const analyzeStress = async (req, res) => {
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

    // Calculate numeric score (0-10)
    const stressScore = calculateStressScore(answers);
    // Human label for the score
    const stressLevelLabel = getStressLevelLabel(stressScore);

    // Build prompt that contains readable answers (not just numbers)
    const prompt = createAnalysisPrompt(answers, stressScore, {
      name: userName,
      age: userAge,
    });

    // Call the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    // same as before: extract text
    const aiText = result.response.text();
    const parsed = parseAIAnalysis(aiText);

    // Save into DB
    const stressAnalysis = new Stress({
      userId,
      answers,
      stressScore,
      stressLevel: stressLevelLabel,
      analysis: parsed.summary,
      trends: parsed.trends || [],
      createdAt: new Date(),
    });

    await stressAnalysis.save();

    // Respond to frontend with numeric and label
    return res.status(200).json({
      success: true,
      analysis: {
        stressScore, // numeric 0-10
        stressLevel: stressLevelLabel, // human label e.g., "Moderate"
        summary: parsed.summary,
        trends: parsed.trends || [],
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Stress analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze stress levels',
      error: error.message,
    });
  }
};

/**
 * Normalize answers to 0..1 (0 = no stress, 1 = max stress), then weight and scale to 0..10
 *
 * - For 1-5 scales: normalize = (value - 1) / 4
 * - For sliders (1-10): normalize = (value - 1) / 9
 *
 * Returns integer 0..10
 */
const calculateStressScore = (answers) => {
  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(answers).forEach(([qIdStr, ansValue]) => {
    const qId = parseInt(qIdStr, 10);
    const weight = WEIGHTS[qId] || 0;
    if (weight === 0) return;

    let normalized = 0;

    if (qId === 3 || qId === 7) {
      // slider 1..10 -> 0..1
      const val = Number(ansValue);
      normalized = Math.max(0, Math.min(1, (val - 1) / 9));
    } else {
      // scale/emoji 1..5 -> 0..1
      const val = Number(ansValue);
      normalized = Math.max(0, Math.min(1, (val - 1) / 4));
    }

    totalScore += normalized * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) return 0;
  const avgNormalized = totalScore / totalWeight; // 0..1
  const scaled = Math.round(avgNormalized * 10); // 0..10
  return scaled;
};

/**
 * Map numeric 0..10 to human readable level.
 * Adjust breakpoints as you prefer.
 */
const getStressLevelLabel = (score) => {
  if (score <= 1) return 'Very Low';
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Moderate';
  if (score <= 8) return 'High';
  return 'Very High';
};

/**
 * Build a clean prompt. We pass readable answers (labels) so AI can surface trends.
 * We explicitly instruct the model to return JSON only with two keys: trends (array) and summary (string).
 */
const createAnalysisPrompt = (answers, stressScore, user) => {
  // helper to turn numeric answer into text
  const answerTextLines = [];
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

  Object.entries(answers).forEach(([qIdStr, ans]) => {
    const qId = Number(qIdStr);
    let text = '';

    if (qId === 3 || qId === 7) {
      // slider -> show as "X/10"
      text = `${ans}/10`;
    } else {
      const labelMap = LABELS[qId] || {};
      text = labelMap[ans] || String(ans);
    }

    const qLabel = questionMappings[qId] || `Q${qId}`;
    answerTextLines.push(`${qLabel}: ${text}`);
  });

  const answersBlock = answerTextLines.join('\n');

  return `
You are a neutral assistant that identifies trends and recurring patterns in short mental-health assessments.

User:
- Name: ${user.name}
- Age: ${user.age}

Numeric stress score (0-10): ${stressScore}

Responses:
${answersBlock}

Output: JSON ONLY (no explanation, no surrounding text). The JSON MUST have exactly two fields:
{
  "trends": ["short trend sentence 1", "short trend sentence 2", "..."],
  "summary": "single brief factual summary describing recurring words, topics, or answer patterns"
}

Examples:
- trends should be short phrases like "low sleep quality", "low energy midday", "high social stress" etc.
- summary should be four or five short sentences, factual and non-judgmental without analysis or suggestions.

Return a valid JSON object only.
`;
};

/**
 * Parse AI response and return { summary, trends }
 * Tolerant to code fences or extra whitespace.
 */
const parseAIAnalysis = (aiResponse) => {
  if (!aiResponse || typeof aiResponse !== 'string') {
    return {
      summary: 'Thank you for completing the assessment.',
      trends: [],
    };
  }

  try {
    // Remove common wrappers like ```json ... ``` or backticks
    const cleaned = aiResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Some models might add stray text before/after JSON; try to find the JSON substring
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    const jsonStr =
      firstBrace !== -1 && lastBrace !== -1
        ? cleaned.slice(firstBrace, lastBrace + 1)
        : cleaned;

    const parsed = JSON.parse(jsonStr);

    return {
      summary: parsed.summary || 'Analysis completed.',
      trends: Array.isArray(parsed.trends) ? parsed.trends : [],
    };
  } catch (err) {
    console.error('Parse AI analysis error:', err);
    return {
      summary: 'Thank you for completing the assessment.',
      trends: [],
    };
  }
};

// export
module.exports = {
  analyzeStress,
  // other handlers can stay as before:
  getStressHistory: async (req, res) => {
    /* unchanged or your existing implementation */
  },
  getStressInsights: async (req, res) => {
    /* unchanged or your existing implementation */
  },
};
