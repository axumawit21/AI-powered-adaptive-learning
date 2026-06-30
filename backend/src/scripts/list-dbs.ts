import { MongoClient } from 'mongodb';

async function listCollections() {
  const uri = "mongodb://localhost:27017/adaptive-learning";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log("--- Collections in 'adaptive-learning' ---");
    collections.forEach(col => console.log(`- ${col.name}`));

    // If no collections, check other databases
    if (collections.length === 0) {
      console.log("\nNo collections in 'adaptive-learning'. Checking other databases...");
      const dbs = await client.db().admin().listDatabases();
      dbs.databases.forEach(dbInfo => console.log(`DB: ${dbInfo.name}`));
    }
  } finally {
    await client.close();
  }
}

listCollections().catch(console.error);
