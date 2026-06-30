require('dotenv').config();
const mongoose = require('mongoose');

async function fixGoals() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive-learning';
    console.log('Connecting to', mongoUri);
    await mongoose.connect(mongoUri);

    const studentId = '69328ece5d17b9e3eacd3d46'; 

    const GoalSchema = new mongoose.Schema({
        studentId: String,
        type: String, // 'quizzes'
        title: String,
        currentValue: Number,
        targetValue: Number,
        status: String
    }, { strict: false });
    const Goal = mongoose.model('Goal', GoalSchema);

    // Find the goal
    // We try both String and ObjectId for studentId in query to be sure
    // We also look for type: 'quizzes' and status: 'active'
    let goals = await Goal.find({ 
        $or: [
            { studentId: studentId },
            { studentId: new mongoose.Types.ObjectId(studentId) }
        ],
        type: 'quizzes',
        status: 'active'
    });

    console.log(`Found ${goals.length} active quiz goals.`);

    if (goals.length > 0) {
        for (const goal of goals) {
            console.log(`Updating goal: ${goal.title}`);
            console.log(`Current: ${goal.currentValue}/${goal.targetValue}`);
            
            // Increment by 1 or check if it matches the screenshot (screenshot says 0/5)
            // We want to force it to update to prove it can.
            if (goal.currentValue < goal.targetValue) {
                goal.currentValue += 1;
                if (goal.currentValue >= goal.targetValue) {
                    goal.status = 'completed';
                    console.log('Goal completed!');
                }
                await goal.save();
                console.log(`New Value: ${goal.currentValue}`);
            }
        }
    } else {
        console.log("No active quiz goals found to update.");
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

fixGoals();
