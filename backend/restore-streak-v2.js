require('dotenv').config();
const mongoose = require('mongoose');

async function restoreStreak() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive-learning';
    console.log('Connecting to', mongoUri);
    await mongoose.connect(mongoUri);

    // User Schema
    const Student = mongoose.model('Student', new mongoose.Schema({ email: String }, { strict: false }));
    const Progress = mongoose.model('Progress', new mongoose.Schema({
        studentId: String,
        dailyTime: Array
    }, { strict: false }), 'progress'); // Collection name usually 'progress' or 'progresses'

    const user = await Student.findOne({ email: 'yorda@gmail.com' });
    if (!user) {
        console.log('User not found!');
        return;
    }
    console.log('User found:', user._id);

    // Find a progress document
    let progress = await Progress.findOne({ studentId: user._id.toString() });
    
    if (!progress) {
        console.log('No progress found, creating dummy...');
        progress = new Progress({
            studentId: user._id.toString(),
            bookId: 'dummy-streak-restorer',
            subjectId: 'general',
            dailyTime: []
        });
    }

    // Generate last 9 days
    const today = new Date();
    const existingDates = new Set(progress.dailyTime.map(d => d.date));
    
    console.log('Current daily entries:', progress.dailyTime.length);

    for (let i = 0; i < 9; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        if (!existingDates.has(dateStr)) {
            console.log('Adding streak day:', dateStr);
            progress.dailyTime.push({ date: dateStr, minutes: 15 });
        }
    }

    await progress.save();
    console.log('Streak restored!');

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

restoreStreak();
