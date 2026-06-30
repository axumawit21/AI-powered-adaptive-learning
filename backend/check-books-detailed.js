require('dotenv').config();
const mongoose = require('mongoose');

async function checkBooksDetailed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_learning';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.\n");

    const collection = mongoose.connection.db.collection('books');
    const books = await collection.find({}).toArray();
    
    console.log(`Total books: ${books.length}\n`);
    
    books.forEach((book, idx) => {
      console.log(`========== Book ${idx + 1} ==========`);
      console.log('Title:', book.title);
      console.log('Grade:', book.grade);
      console.log('Subject:', book.subject);
      console.log('FileURL:', book.fileUrl);
      console.log('FilePath:', book.filePath);
      console.log('Units:', book.units?.length || 0);
      console.log('');
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkBooksDetailed();
