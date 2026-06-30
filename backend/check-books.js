require('dotenv').config();
const mongoose = require('mongoose');

async function checkBooks() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_learning';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const BookSchema = new mongoose.Schema({}, { strict: false });
    const Book = mongoose.model('Book', BookSchema, 'books');

    const books = await Book.find({});
    console.log(`\nFound ${books.length} books in database:\n`);
    
    books.forEach((book, idx) => {
      console.log(`\n[${idx + 1}] Book:`);
      console.log(`  _id: ${book._id}`);
      console.log(`  title: ${book.title}`);
      console.log(`  grade: ${JSON.stringify(book.grade)}`);
      console.log(`  subject: ${JSON.stringify(book.subject)}`);
      console.log(`  fileUrl: ${book.fileUrl || 'NOT SET'}`);
      console.log(`  filePath: ${book.filePath || 'NOT SET'}`);
      console.log(`  units count: ${book.units?.length || 0}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkBooks();
