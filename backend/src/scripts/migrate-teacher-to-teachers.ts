/**
 * Migration Script: Move existing teacher from students collection to teachers collection
 * 
 * This script:
 * 1. Finds teachers in the students collection (role: 'teacher')
 * 2. Creates corresponding documents in the teacherusers collection with teacherId
 * 3. Removes the teacher documents from the students collection
 * 
 * Run with: npx ts-node src/scripts/migrate-teacher-to-teachers.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adaptive_learning';

async function migrateTeachersToNewCollection() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const studentsCollection = db.collection('students');
    const teachersCollection = db.collection('teacherusers');
    
    // Find all teachers in students collection
    const teachersInStudents = await studentsCollection.find({ role: 'teacher' }).toArray();
    
    console.log(`Found ${teachersInStudents.length} teacher(s) in students collection`);
    
    if (teachersInStudents.length === 0) {
      console.log('No teachers to migrate. Exiting.');
      return;
    }
    
    for (const teacher of teachersInStudents) {
      console.log(`\nMigrating teacher: ${teacher.email}`);
      
      // Check if already exists in teachers collection
      const existingTeacher = await teachersCollection.findOne({ email: teacher.email });
      
      if (existingTeacher) {
        console.log(`  Teacher ${teacher.email} already exists in teachers collection. Skipping creation.`);
      } else {
        // Create new teacher document with teacherId
        const newTeacher = {
          email: teacher.email,
          name: teacher.name,
          password: teacher.password,
          role: 'teacher',
          teacherId: `TCH-${Date.now()}`,
          createdAt: teacher.createdAt || new Date(),
          updatedAt: new Date(),
        };
        
        const result = await teachersCollection.insertOne(newTeacher);
        console.log(`  Created teacher in teacherusers collection with ID: ${result.insertedId}`);
        console.log(`  Assigned teacherId: ${newTeacher.teacherId}`);
      }
      
      // Remove from students collection
      const deleteResult = await studentsCollection.deleteOne({ _id: teacher._id });
      if (deleteResult.deletedCount > 0) {
        console.log(`  Removed teacher from students collection`);
      } else {
        console.log(`  Warning: Could not remove teacher from students collection`);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Print summary
    const teacherCount = await teachersCollection.countDocuments();
    const studentCount = await studentsCollection.countDocuments();
    console.log(`\nCollection summary:`);
    console.log(`  - teacherusers collection: ${teacherCount} documents`);
    console.log(`  - students collection: ${studentCount} documents`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
migrateTeachersToNewCollection()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
