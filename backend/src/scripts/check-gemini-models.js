
require('dotenv').config();
const axios = require('axios');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.split(',')[0] : null;
  
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env');
    return;
  }

  console.log(`Checking models for API key: ${apiKey.substring(0, 5)}...`);

  try {
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    console.log('Available Models:');
    const models = response.data.models;
    
    if (models) {
        models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
            console.log(`  Supported methods: ${m.supportedGenerationMethods.join(', ')}`);
        });
    } else {
        console.log('No models returned.');
    }

  } catch (error) {
    console.error('Error listing models:', error.response ? error.response.data : error.message);
  }
}

listModels();
