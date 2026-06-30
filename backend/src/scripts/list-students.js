const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const students = await db.collection('students').find({}).toArray();
    console.log("STUDENTS:");
    students.forEach(s => {
      console.log(`- ${s.name} (${s.email}) ID: ${s._id}`);
    });
  } finally {
    await client.close();
  }
}
check();
