require('dotenv').config();
const mongoose = require('mongoose');

async function listCollections() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive-learning';
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections found:");
    collections.forEach(c => console.log(` - ${c.name}`));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

listCollections();
