const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const question = await db.collection('questions').findOne({ 
      question: /ability of organisms to reproduce/i 
    });
    
    if (question) {
      console.log(`TYPE: ${question.type}`);
      console.log(`OPTIONS: ${JSON.stringify(question.options)}`);
    } else {
      console.log("QUESTION NOT FOUND");
    }
  } finally {
    await client.close();
  }
}
check();
