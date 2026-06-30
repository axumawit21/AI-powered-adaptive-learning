const { MongoClient } = require('mongodb');

async function check() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('adaptive_learning');
    const book = await db.collection('books').findOne({});
    if (book) {
      console.log("SUBJECT_RAW: " + JSON.stringify(book.subject));
      console.log("GRADE_RAW: " + JSON.stringify(book.grade));
    }
  } finally {
    await client.close();
  }
}
check();
