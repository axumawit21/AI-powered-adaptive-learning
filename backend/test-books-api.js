const axios = require('axios');

async function testBooksAPI() {
  try {
    const response = await axios.get('http://localhost:3000/books');
    console.log('Total books returned:', response.data.length);
    console.log('\n========== Books Data ==========');
    response.data.forEach((book, idx) => {
      console.log(`\nBook ${idx + 1}:`);
      console.log('  ID:', book._id);
      console.log('  Title:', book.title);
      console.log('  Grade:', book.grade);
      console.log('  Subject:', book.subject);
      console.log('  FileURL:', book.fileUrl);
      console.log('  FilePath:', book.filePath);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBooksAPI();
