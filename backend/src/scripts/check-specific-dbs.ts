import { MongoClient } from 'mongodb';

async function checkAdaptive() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('adaptive');
    const questions = db.collection('questions');
    const count = await questions.countDocuments({});
    console.log(`Questions in 'adaptive.questions': ${count}`);

    const q2 = await db.collection('questionss').countDocuments({});
    console.log(`Questions in 'adaptive.questionss': ${q2}`);

    // Also check 'adaptive-learning' (the one I checked before but maybe I missed something)
    const db2 = client.db('adaptive-learning');
    const count2 = await db2.collection('questions').countDocuments({});
    console.log(`Questions in 'adaptive-learning.questions': ${count2}`);

  } finally {
    await client.close();
  }
}

checkAdaptive().catch(console.error);
