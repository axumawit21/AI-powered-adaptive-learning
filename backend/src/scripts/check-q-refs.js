const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const q = await db.collection('questions').findOne({});
    if (q) {
      console.log("SAMPLE_QUESTION:");
      console.log(`- subjectId: ${q.subjectId} (type: ${typeof q.subjectId})`);
      console.log(`- gradeId: ${q.gradeId} (type: ${typeof q.gradeId})`);
      
      const s = await db.collection('subjects').findOne({ _id: q.subjectId });
      const g = await db.collection('grades').findOne({ _id: q.gradeId });
      
      console.log(`- Subject found? ${!!s} (${s?.title})`);
      console.log(`- Grade found? ${!!g} (${g?.title})`);
    } else {
      console.log("NO QUESTIONS FOUND");
    }
  } finally {
    await client.close();
  }
}
check();
