// Test script for the NLP API
const axios = require('axios');

async function testNlpAPI() {
  console.log('Testing NLP API...');
  
  // Test with local processing (no API key)
  try {
    console.log('\n--- Testing local processing ---');
    const localResponse = await axios.post('http://localhost:3005/api/nlp', {
      text: 'Order 1 ready'
    });
    
    console.log('Response:', JSON.stringify(localResponse.data, null, 2));
  } catch (error) {
    console.error('Local processing test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
  
  // Test with OpenAI API (replace with your API key)
  const openAIApiKey = 'sk-your-openai-api-key'; // Replace with your API key
  
  if (openAIApiKey && openAIApiKey !== 'sk-your-openai-api-key') {
    try {
      console.log('\n--- Testing with OpenAI ---');
      const openAIResponse = await axios.post('http://localhost:3005/api/nlp', {
        text: 'Can you please mark order 3 as ready?',
        apiKey: openAIApiKey
      });
      
      console.log('Response:', JSON.stringify(openAIResponse.data, null, 2));
    } catch (error) {
      console.error('OpenAI processing test failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
    }
  } else {
    console.log('\n--- Skipping OpenAI test (no API key provided) ---');
  }
}

testNlpAPI(); 