require('dotenv').config();
const mongoose = require('mongoose');

async function findUser() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive-learning';
    console.log('Connecting to', mongoUri);
    await mongoose.connect(mongoUri);

    const StudentSchema = new mongoose.Schema({
        email: String,
        name: String
    }, { strict: false });
    // Model name usually Capitalized singular. 'Student' -> 'students' collection (default)
    const Student = mongoose.model('Student', StudentSchema);

    const email = 'yorda@gmail.com';
    const user = await Student.findOne({ email });

    if (!user) {
        console.log('User not found:', email);
        // List all to debug
        const all = await Student.find({}, 'email');
        console.log('All users:', all);
    } else {
        console.log('User ID:', user._id.toString());
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

findUser();
