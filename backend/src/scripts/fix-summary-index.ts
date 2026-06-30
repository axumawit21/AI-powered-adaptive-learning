/**
 * Migration script to fix Summary schema index
 * 
 * The old index was: { grade: 1, subject: 1, unit: 1 } (unique)
 * The new index is: { grade: 1, subject: 1, unit: 1, subunit: 1 } (unique)
 * 
 * This allows both unit-level summaries (subunit=null) and subunit-level summaries to coexist.
 * 
 * Run with: npx ts-node src/scripts/fix-summary-index.ts
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

async function fixSummaryIndex() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/adaptive_learning';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('summaries');

    // List current indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    // Drop the old index if it exists
    const oldIndexName = 'grade_1_subject_1_unit_1';
    const hasOldIndex = indexes.some(i => i.name === oldIndexName);

    if (hasOldIndex) {
      console.log(`Dropping old index: ${oldIndexName}`);
      await collection.dropIndex(oldIndexName);
      console.log('Old index dropped successfully');
    } else {
      console.log('Old index not found, may have already been updated');
    }

    // Create the new index with subunit field
    console.log('Creating new index with subunit field...');
    await collection.createIndex(
      { grade: 1, subject: 1, unit: 1, subunit: 1 },
      { unique: true, name: 'grade_1_subject_1_unit_1_subunit_1' }
    );
    console.log('New index created successfully');

    // Verify
    const newIndexes = await collection.indexes();
    console.log('Updated indexes:', newIndexes.map(i => i.name));

    console.log('\\n✅ Migration complete! Subunit summaries can now be created.');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixSummaryIndex();
