const { MongoClient } = require('mongodb');

async function listBooks() {
  const client = new MongoClient('mongodb://localhost:27017/adaptive_learning');
  try {
    await client.connect();
    const db = client.db();
    
    const books = await db.collection('books').find({}).toArray();
    console.log(`Found ${books.length} books:\n`);
    
    for (const book of books) {
      console.log(`ID: ${book._id}`);
      console.log(`Title: ${book.title}`);
      console.log(`Preprocessed: ${book.isPreprocessed ? 'Yes' : 'No'}`);
      console.log(`Units: ${book.units?.length || 0}`);
      console.log('---');
    }
  } finally {
    await client.close();
  }
}

listBooks();
