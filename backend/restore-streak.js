require('dotenv').config();
const mongoose = require('mongoose');

async function restoreStreak() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/adaptive-learning';
    console.log('Connecting to MongoDB...', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Define minimal user schema
    const UserSchema = new mongoose.Schema({
        email: String,
        streak: Number
    }, { strict: false });

    const User = mongoose.model('User', UserSchema);

    const email = 'yorda@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
        console.log('User not found:', email);
    } else {
        console.log('User found:', user.email, 'Current Streak:', user.streak);
        user.streak = 9;
        // Also update lastActive or similar if needed to prevent immediate reset, 
        // but the service logic seems to handle "yesterday or today".
        // If the user logs in today, it should correspond to today.
        await user.save();
        console.log('Streak updated to 9.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

restoreStreak();
