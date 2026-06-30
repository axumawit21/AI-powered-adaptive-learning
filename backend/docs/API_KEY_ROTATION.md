# 🔄 Gemini API Key Rotation System

## Overview

This system automatically rotates between multiple Gemini API keys to bypass the 20 requests/day quota limit.

## How It Works

1. **Multiple Keys**: Store multiple API keys separated by commas in `.env`
2. **Automatic Detection**: When a quota error (429) is detected, the system automatically switches to the next key
3. **Seamless Operation**: Users won't notice any interruption - the request is retried with the new key
4. **Round-Robin**: Keys rotate in sequence, cycling back to the first after the last

## Setup Instructions

### Step 1: Generate Multiple API Keys

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create multiple API keys (recommended: 3-5 keys)
3. Copy each key

### Step 2: Add Keys to Your Project

**Option A: Using the Helper Script (Recommended)**

1. Open `src/scripts/update_multiple_keys.ts`
2. Add your keys to the `apiKeys` array:
   ```typescript
   const apiKeys = [
     'AIzaSyC_XvWO9EEAoAYt14sT75J4ZsfjPwFn2Ww',
     'YOUR_SECOND_API_KEY',
     'YOUR_THIRD_API_KEY',
   ];
   ```
3. Run the script:
   ```bash
   npx ts-node src/scripts/update_multiple_keys.ts
   ```

**Option B: Manual Update**
Edit your `.env` file and add all keys separated by commas:

```env
GEMINI_API_KEY=key1,key2,key3,key4
```

### Step 3: Restart Your Backend

The backend will automatically detect and load all keys:

```bash
npm run start:dev
```

You should see a log message like:

```
[LlmService] Loaded 3 API key(s) for rotation
[LlmService] Using API Key #1/3 (gemini-2.0-flash)
```

## Expected Behavior

### Normal Operation

- System uses the first API key
- Requests are processed normally

### When Quota is Exceeded

```
⚠️ Quota exceeded for current API key. Attempting key rotation...
🔄 Rotated to API Key #2/3
✅ Retrying with new API key...
```

### Benefits

- **3 keys** = ~60 requests/day (3 × 20)
- **5 keys** = ~100 requests/day (5 × 20)
- **10 keys** = ~200 requests/day (10 × 20)

## Monitoring

Watch your backend logs to see:

- Which key is currently active
- When rotation occurs
- Total keys available

## Important Notes

⚠️ **Google's Terms of Service**: Make sure using multiple API keys complies with Google's terms of service. This is a technical solution to a quota limitation.

✅ **Free Tier**: All keys should be on the free tier

🔄 **Daily Reset**: Quotas reset at midnight Pacific Time

## Troubleshooting

**Problem**: "No additional API keys available for rotation"

- **Solution**: Add more API keys to your `.env` file

**Problem**: All keys exhausted

- **Solution**: Wait until midnight PT for quota reset, or add more keys

**Problem**: Keys not loading

- **Solution**: Make sure keys are comma-separated with no spaces (or spaces will be trimmed automatically)

## Alternative: Switch to Ollama

If you need unlimited requests, consider switching to local Ollama:

1. Install Ollama: https://ollama.ai
2. Pull models: `ollama pull llama3.2:latest`
3. Change `.env`: `LLM_PROVIDER=ollama`

This gives you unlimited local requests with no API quotas!
