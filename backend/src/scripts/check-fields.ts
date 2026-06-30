import { MongoClient } from 'mongodb';

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const q = await db.collection('questions').findOne({}) as any;
    if (q) {
      console.log("QUESTION_FIELDS:");
      console.log("- subjectId type: " + typeof q.subjectId + " value: " + q.subjectId);
      console.log("- gradeId type: " + typeof q.gradeId + " value: " + q.gradeId);
      console.log("- unitNumber type: " + typeof q.unitNumber + " value: " + q.unitNumber);
      
      const s = await db.collection('subjects').findOne({ _id: q.subjectId });
      console.log("SUBJECT_FOUND: " + !!s);
      
      const g = await db.collection('grades').findOne({ _id: q.gradeId });
      console.log("GRADE_FOUND: " + !!g);
    }
  } finally {
    await client.close();
  }
}
check();
