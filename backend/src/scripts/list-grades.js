const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const grades = await db.collection('grades').find({}).toArray();
    console.log("GRADES:");
    grades.forEach(g => {
      console.log(`- ${g.title} ID: ${g._id}`);
    });
  } finally {
    await client.close();
  }
}
check();
