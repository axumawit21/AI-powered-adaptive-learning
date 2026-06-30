const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const attempts = await db.collection('studentattemptedquestions').find({}).toArray();
    for (const a of attempts) {
      console.log(`STU: ${a.studentId} | LEN: ${a.attemptedQuestionIds.length}`);
    }
  } finally {
    await client.close();
  }
}
check();
