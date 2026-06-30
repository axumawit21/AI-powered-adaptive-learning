import { MongoClient } from 'mongodb';

async function checkGrade() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const q = await db.collection('questions').findOne({ subjectTitle: "Biology" }) as any;
    const g = await db.collection('grades').findOne({ title: "Grade 9" }) as any;
    
    const qgid = q ? q.gradeId.toString() : "NONE";
    const ggid = g ? g._id.toString() : "NONE";
    
    console.log(`QUESTION_GRADE_ID: ${qgid}`);
    console.log(`GRADE_9_ID       : ${ggid}`);
    console.log(`MATCH            : ${qgid === ggid}`);
  } finally {
    await client.close();
  }
}
checkGrade();
