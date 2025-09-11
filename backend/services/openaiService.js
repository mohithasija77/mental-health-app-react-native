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

  return ``;
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
      content: '',
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
  const quickPrompt = ``;

  const messages = [
    {
      role: 'system',
      content: '',
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
      content: systemMessage || '',
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
