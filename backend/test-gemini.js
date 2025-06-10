require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('🔑 API Key exists:', !!process.env.GEMINI_API_KEY);
  console.log(
    '🔑 API Key starts with:',
    process.env.GEMINI_API_KEY?.substring(0, 10) + '...'
  );

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log('🤖 Testing Gemini API...');
    const result = await model.generateContent('Say hello in a friendly way');
    const response = result.response.text();

    console.log('✅ Success! Gemini responded:', response);
  } catch (error) {
    console.error('❌ Gemini test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.status || error.code);
  }
}

testGemini();
