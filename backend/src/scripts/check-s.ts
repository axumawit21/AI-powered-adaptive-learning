import { MongoClient } from 'mongodb';

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive');
    const c = await db.collection('questionss').countDocuments({});
    console.log("QUESTIONS_S_COUNT:" + c);
  } finally {
    await client.close();
  }
}
check();
