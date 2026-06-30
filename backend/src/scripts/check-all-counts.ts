import { MongoClient } from 'mongodb';

async function checkSubjectCounts() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const subjects = await db.collection('subjects').find({}).toArray();
    console.log(`TOTAL_SUBJECTS: ${subjects.length}`);
    for (const s of subjects) {
      const count = await db.collection('questions').countDocuments({ subjectId: s._id });
      console.log(`SUBJECT_DATA: ${s.title} | ${s._id} | ${count}`);
    }
  } finally {
    await client.close();
  }
}
checkSubjectCounts();
