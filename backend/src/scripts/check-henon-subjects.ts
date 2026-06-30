import { MongoClient } from 'mongodb';

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('henon-adaptive-learning');
    const subjects = await db.collection('subjects').find({}).toArray();
    console.log("SUBJECTS_COUNT:" + subjects.length);
  } finally {
    await client.close();
  }
}
check();
