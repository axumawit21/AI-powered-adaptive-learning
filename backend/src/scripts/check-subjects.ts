import { MongoClient } from 'mongodb';

async function checkSubjects() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const subjects = await db.collection('subjects').find({}).toArray();
    console.log("SUBJECT_LIST:" + JSON.stringify(subjects.map(s => ({ id: s._id, title: (s as any).title }))));
  } finally {
    await client.close();
  }
}
checkSubjects();
