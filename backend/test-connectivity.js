
const axios = require('axios');

async function testConnectivity() {
  try {
    console.log('Testing connectivity to Google Gemini API endpoint...');
    // Simple GET to the base API or a discovery endpoint to check access
    const res = await axios.get('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY);
    console.log('✅ Connectivity confirmed. Status:', res.status);
  } catch (error) {
    console.error('❌ Connectivity failed.');
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
      if (error.code) console.error('Error Code:', error.code);
    }
  }
}

require('dotenv').config();
testConnectivity();
