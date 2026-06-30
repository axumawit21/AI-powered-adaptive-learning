require('dotenv').config();
const mongoose = require('mongoose');

async function checkTypes() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_learning';
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const collections = ['goals', 'studentstats', 'progresses'];

    for (const colName of collections) {
        console.log(`\n--- Checking Collection: ${colName} ---`);
        const collection = mongoose.connection.collection(colName);
        const cursor = collection.find().limit(5);
        const docs = await cursor.toArray();

        if (docs.length === 0) {
            console.log("No documents found.");
        } else {
            docs.forEach((doc, index) => {
                console.log(`[${index}] _id: ${doc._id}`);
                console.log(`    studentId value:`, doc.studentId);
                console.log(`    studentId type:`, doc.studentId ? doc.studentId.constructor.name : 'undefined');
                if (colName === 'goals') {
                    console.log(`    Goal Type: ${doc.type}, Status: ${doc.status}, Progress: ${doc.currentValue}/${doc.targetValue}`);
                }
            });
        }
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkTypes();
