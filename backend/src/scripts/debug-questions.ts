import { MongoClient, ObjectId } from 'mongodb';

async function checkQuestions() {
  const uri = "mongodb://localhost:27017/adaptive-learning";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const questions = db.collection('questions');
    
    console.log("--- Question Bank Summary ---");
    const count = await questions.countDocuments({});
    console.log(`Total questions in DB: ${count}`);

    const subjects = await questions.aggregate([
      { $group: { _id: "$subjectId", title: { $first: "$subjectTitle" }, count: { $sum: 1 } } }
    ]).toArray();
    
    console.log("\nBy Subject:");
    subjects.forEach(s => {
      console.log(`- Subject ID: ${s._id}, Title: ${s.title}, Questions: ${s.count}`);
    });

    const sample = await questions.findOne({});
    console.log("\nSample Question:");
    console.log(JSON.stringify(sample, null, 2));

  } finally {
    await client.close();
  }
}

checkQuestions().catch(console.error);
