const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient('mongodb://localhost:27017/adaptive_learning');
  try {
    await client.connect();
    const db = client.db();
    
    console.log('--- EXAM SESSIONS ---');
    const exams = await db.collection('examsessions').find({ completed: true }).toArray();
    console.log(`FOUND ${exams.length} COMPLETED EXAMS`);
    exams.forEach(e => {
      console.log(`EXAM_ID: ${e._id} | SUBJECT_ID: ${e.subjectId} | STUDENT: ${e.studentId} | SCORE: ${e.score}/${e.totalQuestions}`);
    });
    
    console.log('\n--- PROGRESS RECORDS ---');
    const progress = await db.collection('progresses').find({}).toArray();
    console.log(`FOUND ${progress.length} PROGRESS RECORDS`);
    progress.forEach(p => {
      console.log(`PROGRESS_ID: ${p._id} | SUBJECT_ID: ${p.subjectId} | TITLE: ${p.subjectTitle} | STUDENT: ${p.studentId}`);
      if (p.quizResults && p.quizResults.length > 0) {
        console.log(`  -> Quizzes: ${p.quizResults.length} attempts`);
      }
      if (p.unitsProgress && p.unitsProgress.length > 0) {
        console.log(`  -> Units: ${p.unitsProgress.length} tracked`);
      }
    });

    console.log('\n--- STUDENT STATS (Gamification) ---');
    const stats = await db.collection('studentstats').find({}).toArray();
    console.log(`FOUND ${stats.length} STAT RECORDS`);
    stats.forEach(s => {
      console.log(`STUDENT: ${s.studentId} | LEVEL: ${s.level} | POINTS: ${s.totalPoints} | STREAK: ${s.currentStreak} | QUIZZES: ${s.quizzesCompleted} | EXAMS: ${s.examsCompleted}`);
    });

    console.log('\n--- ACHIEVEMENTS ---');
    const achievements = await db.collection('studentachievements').find({}).toArray();
    console.log(`FOUND ${achievements.length} ACHIEVEMENTS`);
    achievements.forEach(a => {
      console.log(`STUDENT: ${a.studentId} | TITLE: ${a.title} | UNLOCKED: ${a.unlockedAt}`);
    });

    console.log('\n--- GOALS ---');
    const goals = await db.collection('goals').find({}).toArray();
    console.log(`FOUND ${goals.length} GOALS`);
    goals.forEach(g => {
      console.log(`STUDENT: ${g.studentId} | TITLE: ${g.title} | TYPE: ${g.type} | STATUS: ${g.status} | PROGRESS: ${g.currentValue}/${g.targetValue}`);
    });
    
  } finally {
    await client.close();
  }
}

run().catch(console.error);

