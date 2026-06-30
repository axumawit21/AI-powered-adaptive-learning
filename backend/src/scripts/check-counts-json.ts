import { MongoClient } from 'mongodb';

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const subjects = await db.collection('subjects').find({}).toArray();
    const results: any[] = [];
    for (const s of subjects) {
      const count = await db.collection('questions').countDocuments({ subjectId: s._id });
      results.push({ title: s.title, id: s._id.toString(), count });
    }
    console.log("RESULTS_START");
    console.log(JSON.stringify(results));
    console.log("RESULTS_END");
  } finally {
    await client.close();
  }
}
check();
