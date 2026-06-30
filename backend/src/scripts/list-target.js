const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const g9 = await db.collection('grades').findOne({ title: /Grade 9/i });
    const bio = await db.collection('subjects').findOne({ title: /Biology/i });
    console.log("GRADE_9:" + (g9 ? g9._id.toString() : "MISSING"));
    console.log("BIOLOGY:" + (bio ? bio._id.toString() : "MISSING"));
  } finally {
    await client.close();
  }
}
check();
