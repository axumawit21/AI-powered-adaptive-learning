require('dotenv').config();
const mongoose = require('mongoose');

async function debugProgress() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive-learning';
    await mongoose.connect(mongoUri);

    // We know the studentId from the logs: 66e85532d5c2e1f2b694b2a8 (yorda@gmail.com)
    // IMPORTANT: In our DB, studentId is often stored as STRING now in Goals, but OBJECTID in Progress.
    // Let's search by string first.
    const studentId = '66e85532d5c2e1f2b694b2a8'; 

    // Define partial schemas (As STRING to catch string-based records)
    const ProgressSchema = new mongoose.Schema({
        studentId: String, 
        dailyTime: [{ date: String, minutes: Number }],
        quizResults: [{ attemptDate: Date, score: Number, totalQuestions: Number }]
    }, { strict: false });
    const Progress = mongoose.model('Progress', ProgressSchema);

    const GoalSchema = new mongoose.Schema({
        studentId: String,
        type: String,
        title: String,
        currentValue: Number,
        targetValue: Number,
        status: String
    }, { strict: false });
        type: String,
        title: String,
        currentValue: Number,
        targetValue: Number,
        status: String
    }, { strict: false });
    const Goal = mongoose.model('Goal', GoalSchema);

    // 1. Analyze Streak Data
    console.log("--- Progress Data for Streak Analysis ---");
    const allProgress = await Progress.find({ studentId });
    const activeDates = new Set();
    
    allProgress.forEach(p => {
        p.dailyTime?.forEach(dt => {
            if (dt.minutes > 0) activeDates.add(dt.date);
        });
        p.quizResults?.forEach(q => {
            if (q.attemptDate) {
                const d = new Date(q.attemptDate).toISOString().split('T')[0];
                activeDates.add(d);
            }
        });
    });

    const sortedDates = Array.from(activeDates).sort().reverse();
    console.log("Active Dates found:", sortedDates);
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    console.log("Today (UTC):", today);
    console.log("Yesterday (UTC):", yesterday);
    console.log("Has Activity Today?", activeDates.has(today));
    console.log("Has Activity Yesterday?", activeDates.has(yesterday));

    // 2. Analyze Goals
    console.log("\n--- Goals Data ---");
    const goals = await Goal.find({ studentId });
    if (goals.length === 0) {
        console.log("No goals found for this ID.");
    } else {
        goals.forEach(g => {
            console.log(`Goal: "${g.title}"`);
            console.log(`  Type: '${g.type}'`);
            console.log(`  Progress: ${g.currentValue}/${g.targetValue}`);
            console.log(`  Status: ${g.status}`);
        });
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

debugProgress();
