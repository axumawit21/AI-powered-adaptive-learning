require('dotenv').config();
const mongoose = require('mongoose');

async function readStats() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_learning';
    await mongoose.connect(mongoUri);

    const studentId = '6932d1ecc809fa0ba44756a'; 
    console.log(`Reading stats for student: ${studentId}`);

    const StudentStatsSchema = new mongoose.Schema({
        studentId: String,
        totalPoints: Number,
        quizzesCompleted: Number,
        examsCompleted: Number,
        currentStreak: Number
    }, { strict: false });
    const StudentStats = mongoose.model('StudentStats', StudentStatsSchema);

    const stats = await StudentStats.findOne({ studentId });
    console.log("Stats:", stats);

    const GoalSchema = new mongoose.Schema({
        studentId: String,
        title: String,
        currentValue: Number,
        targetValue: Number
    }, { strict: false });
    const Goal = mongoose.model('Goal', GoalSchema);
    
    const goals = await Goal.find({ studentId });
    console.log("Goals:", goals);

    const ProgressSchema = new mongoose.Schema({
        studentId: String,
        quizResults: Array
    }, { strict: false });
    const Progress = mongoose.model('Progress', ProgressSchema, 'progresses'); // Correct collection name
    const progress = await Progress.find({ studentId });
    console.log(`Found ${progress.length} progress documents.`);
    if (progress.length > 0) {
        console.log("Last Quiz:", progress[0].quizResults ? progress[0].quizResults.slice(-1) : 'None');
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

readStats();
