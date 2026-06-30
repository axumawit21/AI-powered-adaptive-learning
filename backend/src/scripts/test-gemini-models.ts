import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listModels() {
  const apiKeyRaw = process.env.GEMINI_API_KEY;
  if (!apiKeyRaw) {
    console.error('No GEMINI_API_KEY found in .env');
    return;
  }

  // Handle multiple keys
  const keys = apiKeyRaw.split(',').map(k => k.trim()).filter(k => k.length > 0);
  const key = keys[0];

  console.log(`Using API Key: ${key.substring(0, 5)}...`);

  try {
      const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      
      console.log('Response Status:', response.status);
      console.log('Available Models:');
      const data = response.data as any;
      const models = data.models || [];
      models.forEach((m: any) => {
          if (m.name.includes('gemini')) {
             console.log(` - ${m.name} (Supported: ${m.supportedGenerationMethods?.join(', ')})`);
          }
      });

  } catch (error: any) {
      if (error.response) {
          console.error('API Error Status:', error.response.status);
          console.error('API Error Data:', JSON.stringify(error.response.data, null, 2));
      } else {
          console.error('Error:', error.message);
      }
  }
}

listModels();
