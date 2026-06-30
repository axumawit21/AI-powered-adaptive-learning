require('dotenv').config();
const mongoose = require('mongoose');

async function listCollections() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive-learning';
    await mongoose.connect(mongoUri);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

listCollections();
