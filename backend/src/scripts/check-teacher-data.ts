/**
 * Script to check teacher data and fix question ownership
 * 
 * Run with: npx ts-node src/scripts/check-teacher-data.ts
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adaptive_learning';

async function checkTeacherData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    // 1. Check teacherusers collection
    console.log('=== TEACHER USERS ===');
    const teachers = await db.collection('teacherusers').find({}).toArray();
    console.log(`Found ${teachers.length} teacher(s) in teacherusers collection:`);
    teachers.forEach(t => {
      console.log(`  - ${t.email} (ID: ${t._id}, teacherId: ${t.teacherId})`);
    });
    
    // 2. Check if there are any teachers still in students collection
    console.log('\n=== TEACHERS IN STUDENTS COLLECTION (should be empty) ===');
    const teachersInStudents = await db.collection('students').find({ role: 'teacher' }).toArray();
    console.log(`Found ${teachersInStudents.length} teacher(s) still in students collection:`);
    teachersInStudents.forEach(t => {
      console.log(`  - ${t.email} (ID: ${t._id})`);
    });
    
    // 3. Check questions and their createdBy field
    console.log('\n=== QUESTIONS ===');
    const questions = await db.collection('questions').find({}).toArray();
    console.log(`Found ${questions.length} total questions`);
    
    // Group by createdBy
    const createdByMap = new Map();
    questions.forEach(q => {
      const createdBy = q.createdBy?.toString() || 'unknown';
      if (!createdByMap.has(createdBy)) {
        createdByMap.set(createdBy, []);
      }
      createdByMap.get(createdBy).push(q);
    });
    
    console.log('Questions by creator:');
    for (const [createdBy, qs] of createdByMap) {
      console.log(`  - createdBy: ${createdBy} -> ${qs.length} questions`);
    }
    
    // 4. Try to find questions by the teacher with email aku@gmail.com
    console.log('\n=== FINDING TEACHER aku@gmail.com ===');
    const akuTeacher = await db.collection('teacherusers').findOne({ email: 'aku@gmail.com' });
    if (akuTeacher) {
      console.log(`Found in teacherusers: ID = ${akuTeacher._id}`);
      
      // Check how many questions are linked to this ID
      const questionsForTeacher = await db.collection('questions').find({ 
        createdBy: akuTeacher._id 
      }).toArray();
      console.log(`Questions linked to this ID: ${questionsForTeacher.length}`);
    } else {
      console.log('NOT found in teacherusers');
    }
    
    // Also check if there's an old entry in students
    const akuStudent = await db.collection('students').findOne({ email: 'aku@gmail.com' });
    if (akuStudent) {
      console.log(`\nAlso found in students collection (OLD): ID = ${akuStudent._id}`);
      
      // Check how many questions are linked to the OLD ID
      const questionsForOldId = await db.collection('questions').find({ 
        createdBy: akuStudent._id 
      }).toArray();
      console.log(`Questions linked to OLD ID: ${questionsForOldId.length}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkTeacherData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
