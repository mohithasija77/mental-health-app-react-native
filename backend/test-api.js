const axios = require('axios');

// Configuration - UPDATED TO PORT 5001
const BASE_URL = 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api/mental-health`;

// Mock data for testing
const mockFullAnalysisData = {
  feelingScale: 6,
  sleepQuality: 4,
  stressLevel: 8,
  mood: 'anxious',
  recentEvents: 'Work deadline coming up, had an argument with a friend',
  additionalNotes: 'Having trouble sleeping and feeling overwhelmed',
};

const mockMoodCheckData = {
  mood: 'tired but optimistic',
  feelingScale: 5,
};

// Test scenarios
const testScenarios = [
  {
    name: 'High Stress Scenario',
    data: {
      feelingScale: 3,
      sleepQuality: 2,
      stressLevel: 9,
      mood: 'overwhelmed',
      recentEvents: 'Lost job, relationship issues',
      additionalNotes: "Can't concentrate, feeling hopeless",
    },
  },
  {
    name: 'Good Day Scenario',
    data: {
      feelingScale: 8,
      sleepQuality: 8,
      stressLevel: 3,
      mood: 'happy',
      recentEvents: 'Got a promotion, spent time with family',
      additionalNotes: 'Feeling grateful and energetic',
    },
  },
  {
    name: 'Mixed Feelings Scenario',
    data: {
      feelingScale: 5,
      sleepQuality: 6,
      stressLevel: 6,
      mood: 'uncertain',
      recentEvents: 'Started new job, moved to new city',
      additionalNotes: 'Excited but nervous about changes',
    },
  },
];

// Color coding for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test function for health check
async function testHealthCheck() {
  log('\n📋 Testing Health Check...', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log('✅ Health check passed', 'green');
    log(`Status: ${response.data.status}`, 'green');
    return true;
  } catch (error) {
    log('❌ Health check failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

// Test function for full mental health analysis
async function testMentalHealthAnalysis(testData, scenarioName = 'Default') {
  log(`\n🧠 Testing Mental Health Analysis - ${scenarioName}...`, 'blue');
  try {
    const response = await axios.post(`${API_BASE}/analyze`, testData);

    log('✅ Mental Health Analysis successful', 'green');
    log(`Wellness Score: ${response.data.analysis.wellnessScore}/10`, 'yellow');
    log(
      `Interpretation: ${response.data.analysis.scoreInterpretation}`,
      'yellow'
    );

    // Log first 100 characters of AI response
    const aiResponse = response.data.analysis.aiResponse;
    log(`AI Response Preview: ${aiResponse.substring(0, 100)}...`, 'blue');

    return response.data;
  } catch (error) {
    log('❌ Mental Health Analysis failed', 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(
        `Error: ${error.response.data.error || error.response.data.message}`,
        'red'
      );
    } else {
      log(`Error: ${error.message}`, 'red');
    }
    return null;
  }
}

// Test function for quick mood check
async function testMoodCheck(testData) {
  log('\n😊 Testing Quick Mood Check...', 'blue');
  try {
    const response = await axios.post(`${API_BASE}/mood-check`, testData);

    log('✅ Quick Mood Check successful', 'green');
    log(`Mood: ${response.data.mood}`, 'yellow');
    log(`Feeling Scale: ${response.data.feelingScale}/10`, 'yellow');
    log(`Quick Response: ${response.data.quickResponse}`, 'blue');

    return response.data;
  } catch (error) {
    log('❌ Quick Mood Check failed', 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(
        `Error: ${error.response.data.error || error.response.data.message}`,
        'red'
      );
    } else {
      log(`Error: ${error.message}`, 'red');
    }
    return null;
  }
}

// Test validation errors
async function testValidationErrors() {
  log('\n⚠️  Testing Validation Errors...', 'blue');

  const invalidData = {
    feelingScale: 15, // Invalid - over 10
    sleepQuality: -1, // Invalid - under 1
    stressLevel: 'high', // Invalid - not a number
    mood: 123, // Invalid - not a string
  };

  try {
    await axios.post(`${API_BASE}/analyze`, invalidData);
    log('❌ Validation test failed - should have returned error', 'red');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('✅ Validation errors working correctly', 'green');
      log(`Error message: ${error.response.data.error}`, 'yellow');
    } else {
      log('❌ Unexpected error in validation test', 'red');
    }
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting API Tests...', 'bright');
  log('='.repeat(50), 'blue');

  // Check if server is running
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    log(
      '\n❌ Server is not running. Please start the server first with: node app.js',
      'red'
    );
    return;
  }

  // Test validation
  await testValidationErrors();

  // Test mood check with mock data
  await testMoodCheck(mockMoodCheckData);

  // Test all scenarios for mental health analysis
  for (const scenario of testScenarios) {
    await testMentalHealthAnalysis(scenario.data, scenario.name);

    // Add delay between tests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  log('\n🎉 All tests completed!', 'bright');
  log('='.repeat(50), 'blue');

  // Instructions for next steps
  log('\n📝 Next Steps:', 'yellow');
  log('1. Review the AI responses above', 'reset');
  log('2. Check if the wellness scores make sense', 'reset');
  log('3. Verify error handling is working', 'reset');
  log('4. If everything looks good, we can build the frontend!', 'reset');
}

// Handle command line execution
if (require.main === module) {
  runAllTests().catch((error) => {
    log(`\n💥 Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testHealthCheck,
  testMentalHealthAnalysis,
  testMoodCheck,
  testValidationErrors,
  runAllTests,
};
