import { MongoClient } from 'mongodb';

async function checkAdaptive() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('adaptive');
    
    const collections = await db.listCollections().toArray();
    console.log("Collections in 'adaptive':");
    for (const bin of collections) {
       const count = await db.collection(bin.name).countDocuments({});
       console.log(`- ${bin.name}: ${count}`);
    }

    // Check henon-adaptive-learning too
    const db2 = client.db('henon-adaptive-learning');
    const collections2 = await db2.listCollections().toArray();
    console.log("\nCollections in 'henon-adaptive-learning':");
    for (const bin of collections2) {
       const count = await db2.collection(bin.name).countDocuments({});
       console.log(`- ${bin.name}: ${count}`);
    }

  } finally {
    await client.close();
  }
}

checkAdaptive().catch(console.error);
