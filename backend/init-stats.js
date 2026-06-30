require('dotenv').config();
const mongoose = require('mongoose');

async function initStats() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_learning';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Using the ID found in the database: 6932d1ecc809fa0ba44756a (student@example.com)
    const studentId = '6932d1ecc809fa0ba44756a'; 
    console.log(`Checking stats for student: ${studentId}`);

    const StudentStatsSchema = new mongoose.Schema({
        studentId: String,
        totalPoints: { type: Number, default: 0 },
        quizzesCompleted: { type: Number, default: 0 },
        examsCompleted: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        activityDates: [String]
    }, { timestamps: true });

    const StudentStats = mongoose.model('StudentStats', StudentStatsSchema);

    let stats = await StudentStats.findOne({ studentId });

    if (!stats) {
        console.log("Stats not found. Creating new stats record...");
        stats = await StudentStats.create({
            studentId,
            totalPoints: 0,
            quizzesCompleted: 0,
            examsCompleted: 0,
            currentStreak: 0,
            longestStreak: 0,
            activityDates: [] // Initialize empty
        });
        console.log("Stats created successfully.");
    } else {
        console.log("Stats already exist:", stats);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

initStats();
