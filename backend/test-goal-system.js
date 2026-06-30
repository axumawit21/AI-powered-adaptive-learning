require('dotenv').config();
const mongoose = require('mongoose');

async function testGoalSystem() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive-learning';
    console.log('Connecting to', mongoUri);
    await mongoose.connect(mongoUri);

    // Schemas
    const GoalSchema = new mongoose.Schema({
        studentId: mongoose.Types.ObjectId,
        title: String,
        type: String, 
        currentValue: Number,
        targetValue: Number,
        status: String,
        endDate: Date
    }, { strict: false });
    const Goal = mongoose.model('Goal', GoalSchema);

    const StudentSchema = new mongoose.Schema({ email: String }, { strict: false });
    const Student = mongoose.model('Student', StudentSchema);

    // 1. Get User
    const user = await Student.findOne({ email: 'yorda@gmail.com' });
    if (!user) { console.log('User not found'); return; }
    console.log('User:', user._id);

    // 2. Create a test goal
    console.log('Creating test goal...');
    const goal = await Goal.create({
        studentId: user._id,
        title: 'Test Quiz Goal',
        type: 'quizzes',
        targetValue: 5,
        currentValue: 0,
        status: 'active',
        timeframe: 'weekly',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    console.log('Goal created:', goal._id);

    // 3. Simulate Progress Update (Simulating what GoalService.updateProgressByType does)
    console.log('Simulating update...');
    const goalsToUpdate = await Goal.find({
      studentId: user._id,
      status: 'active',
      type: 'quizzes',
      endDate: { $gte: new Date() }
    });
    console.log('Found goals to update:', goalsToUpdate.length);

    for (const g of goalsToUpdate) {
        console.log(`Updating goal ${g._id} (current: ${g.currentValue})`);
        g.currentValue += 1;
        await g.save();
        console.log(`Updated goal ${g._id} (new: ${g.currentValue})`);
    }

    // 4. Verify
    const updatedGoal = await Goal.findById(goal._id);
    console.log('Final Goal State:', updatedGoal.currentValue);

    // Cleanup
    await Goal.deleteOne({ _id: goal._id });
    console.log('Cleaned up test goal.');

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

testGoalSystem();
