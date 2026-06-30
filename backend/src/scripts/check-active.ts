import { MongoClient } from 'mongodb';

async function checkActive() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const count = await db.collection('questions').countDocuments({ isActive: true });
    console.log("ACTIVE_QUESTIONS:" + count);
  } finally {
    await client.close();
  }
}
checkActive();
