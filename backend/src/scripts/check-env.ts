import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function checkConfig() {
  const envPath = path.resolve(__dirname, '../../.env');
  console.log("Looking for .env at: " + envPath);
  dotenv.config({ path: envPath });
  
  const uri = process.env.MONGO_URI;
  console.log("MONGO_URI: " + (uri ? uri.replace(/:[^:]+@/, ':****@') : "MISSING"));
}
checkConfig();
