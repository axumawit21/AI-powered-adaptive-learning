
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testConnection() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found');
    return;
  }

  console.log("Testing connectivity to Gemini API...");
  try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const result = await model.generateContent("Hello, are you online?");
      const response = await result.response;
      console.log("Success! Response:", response.text());
  } catch (error) {
      console.error("Connection Failed:", error.message);
      if (error.cause) console.error("Cause:", error.cause);
  }
}

testConnection();
