import { MongoClient } from 'mongodb';

async function listAll() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const admin = client.db().admin();
    const dbs = await admin.listDatabases();
    
    for (const dbInfo of dbs.databases) {
      console.log(`\nDB: ${dbInfo.name}`);
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      collections.forEach(col => {
         console.log(`  - ${col.name}`);
      });
    }
  } finally {
    await client.close();
  }
}

listAll().catch(console.error);
