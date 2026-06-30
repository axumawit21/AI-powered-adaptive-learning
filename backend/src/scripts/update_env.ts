
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
const newKey = 'AIzaSyC_XvWO9EEAoAYt14sT75J4ZsfjPwFn2Ww';

try {
  let content = fs.readFileSync(envPath, 'utf8');
  const regex = /GEMINI_API_KEY=.*/g;
  
  if (content.match(regex)) {
    content = content.replace(regex, `GEMINI_API_KEY=${newKey}`);
  } else {
    content += `\nGEMINI_API_KEY=${newKey}`;
  }
  
  fs.writeFileSync(envPath, content, 'utf8');
  console.log('Successfully updated .env with new API Key.');
} catch (e) {
  console.error('Failed to update .env:', e);
  process.exit(1);
}
