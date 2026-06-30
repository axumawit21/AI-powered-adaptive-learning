import { MongoClient, ObjectId } from 'mongodb';

async function checkQuestions() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    
    // List of possible DBs based on previous find
    const dbs = ['adaptive', 'adaptive-learning', 'henon-adaptive-learning', 'adaptive_learning'];
    
    for (const dbName of dbs) {
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      const hasQuestions = collections.some(c => c.name === 'questions');
      
      if (hasQuestions) {
        const count = await db.collection('questions').countDocuments({});
        console.log(`\n--- DB: ${dbName} (Questions: ${count}) ---`);
        
        if (count > 0) {
          const stats = await db.collection('questions').aggregate([
            { $group: { 
                _id: { sid: "$subjectId", gid: "$gradeId", unit: "$unitNumber" }, 
                sTitle: { $first: "$subjectTitle" },
                gTitle: { $first: "$gradeTitle" },
                count: { $sum: 1 } 
              } 
            }
          ]).toArray();
          
          stats.forEach(s => {
            console.log(`Subject: ${s.sTitle} (${s._id.sid}), Grade: ${s.gTitle} (${s._id.gid}), Unit: ${s._id.unit}, Questions: ${s.count}`);
          });
        }
      }
    }

  } finally {
    await client.close();
  }
}

checkQuestions().catch(console.error);
