const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const subjects = await db.collection('subjects').find({}).toArray();
    console.log("ALL_SUBJECTS:");
    subjects.forEach(s => console.log(`- "${s.title}" ID: ${s._id}`));
  } finally {
    await client.close();
  }
}
check();
