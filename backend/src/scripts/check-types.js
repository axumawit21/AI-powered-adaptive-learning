const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const questions = await db.collection('questions').find({}).toArray();
    const stats = {};
    questions.forEach(q => {
      const sType = typeof q.subjectId === 'object' ? 'ObjectId' : typeof q.subjectId;
      const gType = typeof q.gradeId === 'object' ? 'ObjectId' : typeof q.gradeId;
      const key = `S:${sType} G:${gType}`;
      stats[key] = (stats[key] || 0) + 1;
    });
    console.log("ID_TYPE_STATS:");
    console.log(JSON.stringify(stats));
  } finally {
    await client.close();
  }
}
check();
