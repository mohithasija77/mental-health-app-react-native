const axios = require('axios');

// OpenAI configuration
const OPENAI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// Helper function to create detailed mental health prompt
const createMentalHealthPrompt = (userInput) => {
  const {
    feelingScale,
    sleepQuality,
    stressLevel,
    mood,
    recentEvents,
    additionalNotes,
  } = userInput;

  return `As a mental health analysis assistant, please analyze the following user input and provide supportive insights:

User Mental Health Assessment:
- Overall feeling today (1-10 scale): ${feelingScale}
- Sleep quality (1-10 scale): ${sleepQuality}
- Stress level (1-10 scale): ${stressLevel}
- Current mood: ${mood}
- Recent significant events: ${recentEvents || 'None mentioned'}
- Additional notes: ${additionalNotes || 'None provided'}

Please provide:
1. A brief analysis of their current mental state
2. Potential areas of concern (if any)
3. Positive aspects to acknowledge
4. Gentle suggestions for improvement or coping strategies
5. When to consider seeking professional help

Keep the response supportive, non-diagnostic, and encouraging. Limit response to 300-400 words.`;
};

// Helper function to make OpenAI API request
const makeOpenAIRequest = async (
  messages,
  maxTokens = 500,
  temperature = 0.7
) => {
  // Check if API key is configured
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: messages,
    max_tokens: maxTokens,
    temperature: temperature,
  };

  try {
    const response = await axios.post(OPENAI_URL, requestBody, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key');
    }

    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded');
    }

    if (error.response?.status === 400) {
      throw new Error('Invalid request to OpenAI API');
    }

    throw new Error('Failed to get response from OpenAI API');
  }
};

// Service function for full mental health analysis
const getFullMentalHealthAnalysis = async (userInput) => {
  const prompt = createMentalHealthPrompt(userInput);

  const messages = [
    {
      role: 'system',
      content:
        'You are a supportive mental health assistant. Provide helpful, empathetic responses while being clear that you are not a replacement for professional mental health care. Never provide medical diagnoses.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  return await makeOpenAIRequest(messages, 500, 0.7);
};

// Service function for quick mood analysis
const getQuickMoodAnalysis = async (mood, feelingScale) => {
  const quickPrompt = `User reports feeling "${mood}" with an overall feeling scale of ${feelingScale}/10. Provide a brief, encouraging response (2-3 sentences) and one simple suggestion for their day.`;

  const messages = [
    {
      role: 'system',
      content:
        'You are a supportive assistant providing quick, encouraging responses to mood check-ins.',
    },
    {
      role: 'user',
      content: quickPrompt,
    },
  ];

  return await makeOpenAIRequest(messages, 150, 0.8);
};

// Service function for custom prompts (extensible for future use)
const getCustomAnalysis = async (customPrompt, systemMessage = null) => {
  const messages = [
    {
      role: 'system',
      content:
        systemMessage || 'You are a helpful mental health support assistant.',
    },
    {
      role: 'user',
      content: customPrompt,
    },
  ];

  return await makeOpenAIRequest(messages);
};

module.exports = {
  getFullMentalHealthAnalysis,
  getQuickMoodAnalysis,
  getCustomAnalysis,
};
