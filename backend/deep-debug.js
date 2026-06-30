require('dotenv').config();
const mongoose = require('mongoose');

async function deeplyDebug() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive-learning';
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);

    // 1. Identify User
    const studentCollection = mongoose.connection.collection('students');
    const user = await studentCollection.findOne({ email: 'yorda@gmail.com' }); // From screenshot
    
    if (!user) {
        console.log("CRITICAL: User 'yorda@gmail.com' not found in 'students' collection.");
        // List a few users to see what's there
        const users = await studentCollection.find().limit(3).toArray();
        console.log("Sample users:", users);
        return;
    }

    const userId = user._id;
    console.log("User Found:", userId.toString(), "Type:", typeof userId);

    // 2. Check Progress with this ID
    const progressCollection = mongoose.connection.collection('progress');
    // Try querying with ObjectId
    let progressDocs = await progressCollection.find({ studentId: userId }).toArray();
    console.log(`Progress docs found (using ObjectId match): ${progressDocs.length}`);

    if (progressDocs.length === 0) {
        // Try String
        console.log("Trying string match for studentId...");
        progressDocs = await progressCollection.find({ studentId: userId.toString() }).toArray();
        console.log(`Progress docs found (using String match): ${progressDocs.length}`);
    }

    if (progressDocs.length > 0) {
        const activeDates = new Set();
        progressDocs.forEach(p => {
             // Check Daily Time
             if (Array.isArray(p.dailyTime)) {
                 p.dailyTime.forEach(dt => {
                     // Check various formats just in case
                     if (dt.minutes > 0) activeDates.add(dt.date);
                 });
             }
             // Check Quiz Results
             if (Array.isArray(p.quizResults)) {
                 p.quizResults.forEach(q => {
                     if (q.attemptDate) {
                         const d = new Date(q.attemptDate).toISOString().split('T')[0];
                         activeDates.add(d);
                     }
                 });
             }
        });
        console.log("Active Dates derived:", Array.from(activeDates).sort());
    }

    // 3. Check Goals
    const goalCollection = mongoose.connection.collection('goals');
    // Try ObjectId
    let goals = await goalCollection.find({ studentId: userId }).toArray();
    console.log(`Goals found (using ObjectId match): ${goals.length}`);

    if (goals.length === 0) {
         // Try String
         goals = await goalCollection.find({ studentId: userId.toString() }).toArray();
         console.log(`Goals found (using String match): ${goals.length}`);
    }

    goals.forEach(g => {
        console.log(`Goal: "${g.title}" [${g.status}]`);
        console.log(`   Type: '${g.type}'`);
        console.log(`   ID: ${g._id}`);
    });

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

deeplyDebug();
