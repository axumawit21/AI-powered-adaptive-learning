import { MongoClient } from 'mongodb';

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const q = await db.collection('questions').findOne({}) as any;
    if (q) {
      console.log("SAMPLE_Q_IDS:" + JSON.stringify({ 
        subjectId: q.subjectId, 
        subjectTitle: q.subjectTitle,
        gradeId: q.gradeId,
        gradeTitle: q.gradeTitle 
      }));
    } else {
      console.log("NO_QUESTIONS_FOUND");
    }
  } finally {
    await client.close();
  }
}
check();
