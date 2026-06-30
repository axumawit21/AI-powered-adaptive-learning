const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const subjects = await db.collection('subjects').find({}).toArray();
    for (const s of subjects) {
      const count = await db.collection('questions').countDocuments({ subjectId: s._id });
      if (count > 0) {
        console.log(`FOUND: ${s.title} (${s._id}) has ${count} questions`);
      } else {
        console.log(`EMPTY: ${s.title} (${s._id})`);
      }
    }
  } finally {
    await client.close();
  }
}
check();
