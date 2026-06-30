
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.models) {
          const names = data.models.map(m => m.name).join('\n');
          fs.writeFileSync('models_cleaned.txt', names, 'utf8');
          console.log('Wrote models to models_cleaned.txt');
      } else {
          console.log('No models found:', data);
      }
  } catch (e) {
      console.error('Error listing models:', e);
  }
}

listModels();
