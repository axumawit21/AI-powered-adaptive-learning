// Diagnostic script to find ID mismatch between books and questions
const http = require('http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse: ' + data.substring(0, 200)));
        }
      });
    }).on('error', reject);
  });
}

async function diagnose() {
  try {
    // 1. Get all books
    console.log('=== BOOKS ===');
    const books = await httpGet('http://localhost:3000/books');
    
    for (const book of books) {
      console.log(`Book: ${book.title}`);
      console.log(`  _id: ${book._id}`);
      console.log(`  subject._id: ${book.subject?._id || book.subject}`);
      console.log(`  grade._id: ${book.grade?._id || book.grade}`);
      console.log('');
    }

    // 2. Get questions
    console.log('=== QUESTIONS ===');
    const questions = await httpGet('http://localhost:3000/question-bank/debug/list');
    
    console.log(`Total questions: ${questions.count}`);
    if (questions.questions && questions.questions.length > 0) {
      const sample = questions.questions[0];
      console.log(`Sample question subjectId: ${sample.subjectId}`);
      console.log(`Sample question gradeId: ${sample.gradeId}`);
    }

    // 3. Compare
    console.log('\n=== COMPARISON ===');
    for (const book of books) {
      const bookSubjectId = (book.subject?._id || book.subject || '').toString();
      const bookGradeId = (book.grade?._id || book.grade || '').toString();
      
      // Check if any questions match
      const matchingQuestions = (questions.questions || []).filter(q => 
        q.subjectId === bookSubjectId
      );
      
      console.log(`Book "${book.title}":`);
      console.log(`  Book Subject ID: ${bookSubjectId}`);
      console.log(`  Matching questions: ${matchingQuestions.length}`);
      
      if (matchingQuestions.length === 0 && questions.questions && questions.questions.length > 0) {
        console.log(`  MISMATCH! Question subjectId: ${questions.questions[0].subjectId}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

diagnose();
