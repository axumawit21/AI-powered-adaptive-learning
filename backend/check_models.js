const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkModels() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim());
  if (keys.length === 0) {
    console.error('No GEMINI_API_KEY found in .env');
    return;
  }

  const apiKey = keys[0]; // Use the first key
  console.log(`Checking models with API Key: ${apiKey.substring(0, 10)}...`);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    
    const models = [];
    console.log('\n✅ Available Models:');
    response.data.models.forEach(model => {
      if (model.supportedGenerationMethods.includes('generateContent')) {
        console.log(`- ${model.name}`);
        models.push(model.name);
      }
    });
    
    // Write to file cleanly
    const fs = require('fs');
    fs.writeFileSync('models_utf8.txt', models.join('\n'), 'utf8');
    console.log('Saved to models_utf8.txt');

  } catch (error) {
    console.error('❌ Error fetching models:', error.response ? error.response.data : error.message);
  }
}

checkModels();

