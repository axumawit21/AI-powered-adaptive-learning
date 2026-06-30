require('dotenv').config();
const mongoose = require('mongoose');

// MOCK Services to simulate the flow
// We will basically copy-paste the logic from GamificationService and GoalService here to verify it works in isolation

async function verifyTracking() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_learning'; 
    await mongoose.connect(mongoUri);

    const studentId = '6932d1ecc809fa0ba44756a'; 

    // --- SCHEMAS ---
    const GoalSchema = new mongoose.Schema({
        studentId: String,
        type: String, // 'quizzes', 'exams'
        currentValue: { type: Number, default: 0 },
        targetValue: Number,
        status: String,
        endDate: Date
    }, { strict: false });
    const Goal = mongoose.model('Goal', GoalSchema);

    // 1. FETCH GOAL
    console.log("1. Fetching active 'quizzes' goals...");
    const goals = await Goal.find({
        studentId,
        type: 'quizzes',
        status: 'active'
    });

    if (goals.length === 0) {
        console.log("No active quiz goals found! Cannot verify.");
        // Create one just for testing
        console.log("Creating test goal...");
        await Goal.create({
            studentId,
            type: 'quizzes',
            title: 'Test Goal',
            currentValue: 0,
            targetValue: 5,
            status: 'active',
            endDate: new Date(Date.now() + 86400000)
        });
    } else {
        console.log(`Found ${goals.length} active goals.`);
        goals.forEach(g => console.log(` - Goal: ${g.currentValue}/${g.targetValue}`));
    }

    // 2. SIMULATE UPDATE Logic (The exact logic from GoalService)
    console.log("\n2. Simulating 'recordActivity' -> 'updateProgressByType'...");
    
    const goalType = 'quizzes';
    const amount = 1;

    const goalsToUpdate = await Goal.find({
      studentId: studentId.toString(),
      status: 'active',
      type: goalType,
      endDate: { $gte: new Date() } 
    });

    console.log(`Found ${goalsToUpdate.length} goals matching update criteria.`);

    for (const g of goalsToUpdate) {
        const oldVal = g.currentValue;
        g.currentValue += amount;
        console.log(`Updating Goal ${g._id}: ${oldVal} -> ${g.currentValue}`);
        await g.save();
    }

    // 3. VERIFY
    console.log("\n3. Verification:");
    const updatedGoals = await Goal.find({ studentId, type: 'quizzes', status: 'active' });
    updatedGoals.forEach(g => console.log(` - Goal is now: ${g.currentValue}/${g.targetValue}`));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyTracking();
