require('dotenv').config();
const mongoose = require('mongoose');

async function listUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_learning';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const UserSchema = new mongoose.Schema({
        email: String,
        name: String,
        // _id is implicit
    }, { strict: false });

    const User = mongoose.model('User', UserSchema, 'users'); 
    // explicitly bind to 'users' collection just in case

    const users = await User.find({});
    console.log(`Found ${users.length} users in 'users' collection:`);
    users.forEach(u => console.log(` - ID: ${u._id} | Name: ${u.name} | Email: ${u.email}`));

    const Student = mongoose.model('Student', UserSchema, 'students');
    const students = await Student.find({});
    console.log(`\nFound ${students.length} students in 'students' collection:`);
    students.forEach(s => console.log(` - ID: ${s._id} | Name: ${s.name} | Email: ${s.email}`));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();
