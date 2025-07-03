// Test script for the Gemini API integration
const axios = require('axios');

async function testGeminiAPI() {
  console.log('Testing Gemini API integration...');
  
  // Replace with your Gemini API key
  const geminiApiKey = 'AIzaSyBgIul-GcEqb75VEAmS1v3BOCtG0SBYCgg';
  
  try {
    console.log('\n--- Testing with Gemini API ---');
    const response = await axios.post('http://localhost:3005/api/nlp', {
      text: 'Can you set order 3 to ready please?',
      apiKey: geminiApiKey
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Gemini API test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
  
  // Also test with a different command to make sure various commands work
  try {
    console.log('\n--- Testing another command with Gemini ---');
    const response = await axios.post('http://localhost:3005/api/nlp', {
      text: 'Show me all the current orders',
      apiKey: geminiApiKey
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Gemini API test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
  
  // Test local fallback (no API key)
  try {
    console.log('\n--- Testing local fallback processing (no API key) ---');
    const response = await axios.post('http://localhost:3005/api/nlp', {
      text: 'Order 5 is complete'
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Local processing test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testGeminiAPI(); 