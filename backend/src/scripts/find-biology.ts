import { MongoClient } from 'mongodb';

async function findBiology() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const b = await db.collection('subjects').findOne({ title: "Biology" }) as any;
    console.log("BIOLOGY_ID:" + (b ? b._id.toString() : "NOT_FOUND"));
    
    const q = await db.collection('questions').findOne({ subjectTitle: "Biology" }) as any;
    console.log("QUESTION_SUBJECT_ID:" + (q ? q.subjectId.toString() : "NOT_FOUND"));
  } finally {
    await client.close();
  }
}
findBiology();
