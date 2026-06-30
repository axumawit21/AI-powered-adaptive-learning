import { MongoClient } from 'mongodb';

async function compare() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const b = await db.collection('subjects').findOne({ title: "Biology" }) as any;
    const q = await db.collection('questions').findOne({ subjectTitle: "Biology" }) as any;
    
    const bid = b ? b._id.toString() : "NONE";
    const qid = q ? q.subjectId.toString() : "NONE";
    
    console.log(`SUBJECT_ID:  ${bid}`);
    console.log(`QUESTION_ID: ${qid}`);
    console.log(`MATCH:       ${bid === qid}`);
  } finally {
    await client.close();
  }
}
compare();
