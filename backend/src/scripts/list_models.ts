
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in .env');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Create a dummy model instance just to access the model manager? 
  // Actually the SDK might not expose listModels directly on the instance easily without a model manager.
  // Checking SDK docs pattern: usually via GoogleGenerativeAI class or a manager.
  // Wait, the error message said "Call ListModels".
  // Let's try to find it on the genAI instance or just fetch via REST if SDK is obscure.
  // Looking at common usage: genAI.getGenerativeModel is for specific.
  // Let's try raw REST just to be 100% sure if SDK typings are obscure.
  
  // Or better, let's use the SDK's model manager if available.
  // Since I can't browse docs, I will use a simple fetch to the API endpoint which is standard.
  // Endpoint: https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY
  
  try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      
      if (data.models) {
          console.log("--- START MODEL LIST ---");
          for (const m of data.models) {
              if (m.supportedGenerationMethods.includes('generateContent')) {
                  console.log(m.name);
              }
          }
          console.log("--- END MODEL LIST ---");
      } else {
          console.error("No models found:", data);
      }
  } catch (error) {
      console.error("Error listing models:", error);
  }
}

listModels();
