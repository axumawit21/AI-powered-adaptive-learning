import { MongoClient } from 'mongodb';

async function checkAttempts() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const attempts = await db.collection('studentattemptedquestions').find({}).toArray();
    console.log(`Found ${attempts.length} attempt records.`);
    attempts.forEach(a => {
      console.log(`Student: ${a.studentId}, Subject: ${a.subjectId}, Count: ${a.attemptedQuestionIds?.length}`);
    });
  } finally {
    await client.close();
  }
}
checkAttempts();
