
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');

// Add your API keys here, separated by commas
const apiKeys = [
  'AIzaSyC_XvWO9EEAoAYt14sT75J4ZsfjPwFn2Ww',
  'AIzaSyDuzhHTuMSGIrAX6KMOQghyxgyTxFf_f8Y',
  'AIzaSyC89zAegoGj-hhyFywUD-gbTUEVZFGFeo4',
  'AIzaSyD0NCJbkFsPnDhX2ZZ6xxSR0TnUpg_fCn0',
];

try {
  let content = fs.readFileSync(envPath, 'utf8');
  const regex = /GEMINI_API_KEY=.*/g;
  
  // Join all keys with commas
  const keysString = apiKeys.join(',');
  
  if (content.match(regex)) {
    content = content.replace(regex, `GEMINI_API_KEY=${keysString}`);
  } else {
    content += `\nGEMINI_API_KEY=${keysString}`;
  }
  
  fs.writeFileSync(envPath, content, 'utf8');
  console.log(`✅ Successfully updated .env with ${apiKeys.length} API key(s).`);
  console.log(`📊 Total daily quota: ~${apiKeys.length * 20} requests (20 per key)`);
} catch (e) {
  console.error('❌ Failed to update .env:', e);
  process.exit(1);
}
