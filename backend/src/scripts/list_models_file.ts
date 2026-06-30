
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found');
    return;
  }

  try {
      // Use raw fetch for transparency
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      
      let output = "AVAILABLE_MODELS:\n";
      if (data.models) {
          for (const m of data.models) {
              if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                  output += m.name + "\n";
              }
          }
      }
      
      const outputPath = path.resolve(__dirname, 'gemini_models_list.txt');
      fs.writeFileSync(outputPath, output);
      console.log(`Models written to: ${outputPath}`);

  } catch (error) {
      console.error("Error:", error);
  }
}

listModels();
