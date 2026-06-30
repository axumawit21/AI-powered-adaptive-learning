import { MongoClient } from 'mongodb';

async function checkHenon() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('henon-adaptive-learning');
    const collections = await db.listCollections().toArray();
    console.log(`Collections in 'henon-adaptive-learning': ${collections.map(c => c.name).join(', ')}`);
  } finally {
    await client.close();
  }
}
checkHenon();
