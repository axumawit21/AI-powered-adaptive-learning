
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require('fs');

// Simple .env parser to avoid dotenv caching issues or path issues
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('GEMINI_API_KEY=')) {
        return line.split('=')[1].trim();
      }
    }
  } catch (e) {
    console.error('Failed to read .env:', e.message);
  }
  return null;
}

async function verifyKey() {
    const apiKey = loadEnv();
    if (!apiKey) {
        console.error('❌ Could not find GEMINI_API_KEY in .env');
        return;
    }
    console.log('Testing Key:', apiKey.substring(0, 10) + '...');
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Try gemini-1.5-flash as a standard test model
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log('✅ Success! Model Response:', response.text());
    } catch (e) {
        console.error('❌ Error testing key:', e.message);
        if (e.message.includes('404')) console.log('Hint: Model name might be wrong for this key.');
        if (e.message.includes('429')) console.log('Hint: Quota exceeded.');
    }
}

verifyKey();
