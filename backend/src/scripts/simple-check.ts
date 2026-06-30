import { MongoClient } from 'mongodb';

async function checkQuestions() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const count = await db.collection('questions').countDocuments({});
    console.log("TOTAL_QUESTIONS:" + count);
    
    const subjects = await db.collection('questions').aggregate([
      { $group: { _id: "$subjectTitle", count: { $sum: 1 } } }
    ]).toArray();
    console.log("SUBJECTS_JSON:" + JSON.stringify(subjects));

    const sample = await db.collection('questions').findOne({});
    console.log("SAMPLE_QUESTION_JSON:" + JSON.stringify(sample));

  } finally {
    await client.close();
  }
}
checkQuestions();
