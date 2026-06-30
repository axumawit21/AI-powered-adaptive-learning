const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const g9 = await db.collection('grades').findOne({ title: /Grade 9/i });
    const bio = await db.collection('subjects').findOne({ title: /Biology/i });
    if (g9) {
        const id = g9._id.toString();
        console.log(`G9_ID: "${id}" (LEN: ${id.length})`);
    }
    if (bio) {
        const id = bio._id.toString();
        console.log(`BIO_ID: "${id}" (LEN: ${id.length})`);
    }
  } finally {
    await client.close();
  }
}
check();
