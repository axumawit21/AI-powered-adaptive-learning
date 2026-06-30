require('dotenv').config();
const mongoose = require('mongoose');

async function createGoal() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_learning';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // The user ID found in 'users' collection
    const studentId = '6932d1ecc809fa0ba44756a'; 

    const GoalSchema = new mongoose.Schema({
        studentId: String,
        type: String,
        title: String,
        description: String,
        targetValue: Number,
        currentValue: { type: Number, default: 0 },
        status: { type: String, default: 'active' },
        timeframe: String,
        startDate: Date,
        endDate: Date
    }, { strict: false });

    const Goal = mongoose.model('Goal', GoalSchema);

    // Create a new goal
    const newGoal = await Goal.create({
        studentId,
        type: 'quizzes',
        title: 'Debug Goal: Complete 3 Quizzes',
        description: 'Created by support to verify tracking',
        targetValue: 3,
        currentValue: 0,
        status: 'active',
        timeframe: 'weekly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    console.log("Created Goal:", newGoal);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

createGoal();
