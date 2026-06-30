import { MongoClient, ObjectId } from 'mongodb';

async function checkBioCount() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const bio = await db.collection('subjects').findOne({ title: "Biology" }) as any;
    if (!bio) {
       console.log("Biology subject not found");
       return;
    }
    const bioId = bio._id;
    console.log("Bio ID: " + bioId);
    
    const count = await db.collection('questions').countDocuments({ subjectId: bioId });
    console.log("Questions with Bio ID: " + count);
    
    const activeCount = await db.collection('questions').countDocuments({ subjectId: bioId, isActive: true });
    console.log("Active Questions with Bio ID: " + activeCount);
    
    // Check with gradeId
    const g9 = await db.collection('grades').findOne({ title: "Grade 9" }) as any;
    if (g9) {
       console.log("Grade 9 ID: " + g9._id);
       const g9count = await db.collection('questions').countDocuments({ subjectId: bioId, gradeId: g9._id, isActive: true });
       console.log("Active Questions with Bio ID AND Grade 9 ID: " + g9count);
    }

  } finally {
    await client.close();
  }
}
checkBioCount();
