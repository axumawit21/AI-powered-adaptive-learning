
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testAudioGeneration() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Trying the current lite model first, if it fails we might check others
  const modelName = 'gemini-2.0-flash-lite-preview-02-05'; 
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = "Explain quantum physics in one sentence and generating audio for it.";
  
  try {
      // Standard generation config for audio? 
      // Documentation is sparse on "native audio output" for the JS SDK specifically for valid property names.
      // Usually it's response_mime_type or response_modality?
      // For now let's just try to see if it returns any audio-like data or if we can prompt it.
      
      // Actually, standard Gemini 1.5/2.0 text-to-text models don't just "output audio" via generateContent unless specifically configured.
      // Let's try to ask for it.
      
      console.log(`Testing model: ${modelName}`);
      const result = await model.generateContent([
          prompt
      ]);
      const response = await result.response;
      console.log("Response text:", response.text());
      
      // Check for candidates or parts that might differ
      console.log("Full response struct:", JSON.stringify(result.response, null, 2));

  } catch (error) {
      console.error("Error generating:", error);
  }
}

testAudioGeneration();
