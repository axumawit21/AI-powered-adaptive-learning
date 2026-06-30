import { MongoClient, ObjectId } from 'mongodb';

async function checkMismatches() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    
    const questions = await db.collection('questions').find({}).toArray();
    const subjects = await db.collection('subjects').find({}).toArray();
    
    console.log(`Found ${questions.length} questions and ${subjects.length} subjects.`);
    
    const subjectIds = new Set(subjects.map(s => s._id.toString()));
    
    const mismatched = questions.filter(q => !subjectIds.has(q.subjectId?.toString()));
    
    console.log(`Mismatched questions: ${mismatched.length}`);
    if (mismatched.length > 0) {
      console.log("Sample mismatched subjectId: " + mismatched[0].subjectId);
    }

    // Check if the IDs are strings or ObjectIds in the questions collection
    const sampleQ = questions[0];
    console.log("Question subjectId type: " + (typeof sampleQ.subjectId) + " constructor: " + sampleQ.subjectId?.constructor?.name);

  } finally {
    await client.close();
  }
}
checkMismatches();
