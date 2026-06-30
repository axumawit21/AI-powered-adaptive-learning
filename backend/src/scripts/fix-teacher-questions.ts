/**
 * Comprehensive script to find and fix teacher questions
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adaptive_learning';

async function findAndFixTeacherQuestions() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    // 1. Get all teachers
    console.log('=== TEACHERS ===');
    const teachers = await db.collection('teacherusers').find({}).toArray();
    teachers.forEach(t => {
      console.log(`${t.email}: ${t._id}`);
    });
    
    // 2. Get all questions with creatorType = 'teacher' or source = 'teacher'
    console.log('\n=== TEACHER QUESTIONS ===');
    const teacherQuestions = await db.collection('questions').find({ 
      $or: [
        { creatorType: 'teacher' },
        { source: 'teacher' }
      ]
    }).toArray();
    
    console.log(`Found ${teacherQuestions.length} questions with creatorType/source=teacher`);
    
    if (teacherQuestions.length === 0) {
      console.log('\nNo teacher questions found. Checking ALL questions...');
      const allQuestions = await db.collection('questions').find({}).limit(5).toArray();
      console.log(`Sample of all questions (first 5):`);
      allQuestions.forEach(q => {
        console.log(`  - ${q.questionId}: createdBy=${q.createdBy}, creatorType=${q.creatorType}, source=${q.source}`);
      });
      
      const totalCount = await db.collection('questions').countDocuments({});
      console.log(`\nTotal questions in database: ${totalCount}`);
      return;
    }
    
    // 3. Group questions by createdBy
    const createdByMap = new Map<string, any[]>();
    teacherQuestions.forEach(q => {
      const key = q.createdBy?.toString() || 'undefined';
      if (!createdByMap.has(key)) {
        createdByMap.set(key, []);
      }
      createdByMap.get(key)!.push(q);
    });
    
    console.log('\nQuestions grouped by createdBy:');
    for (const [createdBy, qs] of createdByMap) {
      console.log(`  ${createdBy}: ${qs.length} questions`);
    }
    
    // 4. For teacher aku@gmail.com, update all their questions
    const akuTeacher = teachers.find(t => t.email === 'aku@gmail.com');
    if (akuTeacher) {
      console.log(`\n=== FIXING QUESTIONS FOR aku@gmail.com ===`);
      console.log(`New teacher ID: ${akuTeacher._id}`);
      
      // Update ALL teacher questions to belong to this teacher
      // (assuming aku@gmail.com is the main teacher who created these)
      const result = await db.collection('questions').updateMany(
        { 
          $or: [
            { creatorType: 'teacher' },
            { source: 'teacher' }
          ]
        },
        { 
          $set: { 
            createdBy: akuTeacher._id 
          } 
        }
      );
      
      console.log(`Updated ${result.modifiedCount} questions`);
      
      // Verify
      const verifyCount = await db.collection('questions').countDocuments({
        createdBy: akuTeacher._id
      });
      console.log(`Questions now owned by aku@gmail.com: ${verifyCount}`);
    }
    
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

findAndFixTeacherQuestions();
