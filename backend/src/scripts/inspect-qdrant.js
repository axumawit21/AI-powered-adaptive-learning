/**
 * Script to inspect Qdrant chunks and verify enhanced metadata
 */
const { QdrantClient } = require('@qdrant/js-client-rest');

async function inspectQdrant() {
  const qdrant = new QdrantClient({ url: 'http://localhost:6333' });
  
  try {
    // 1. List all collections
    const collections = await qdrant.getCollections();
    console.log('=== QDRANT COLLECTIONS ===');
    console.log(`Found ${collections.collections.length} collections:\n`);
    
    for (const col of collections.collections) {
      console.log(`📦 ${col.name}`);
      
      // Get collection info
      const info = await qdrant.getCollection(col.name);
      console.log(`   Points: ${info.points_count}`);
      console.log(`   Indexed: ${info.indexed_vectors_count}`);
      
      // Sample a chunk to see its structure
      const sample = await qdrant.scroll(col.name, {
        limit: 1,
        with_payload: true,
      });
      
      if (sample.points && sample.points.length > 0) {
        const payload = sample.points[0].payload;
        console.log(`   Sample Chunk Keys: ${Object.keys(payload).join(', ')}`);
        
        // Check for enhanced fields
        const hasContextualHeader = 'contextualHeader' in payload;
        const hasPrevNext = 'prevChunkId' in payload && 'nextChunkId' in payload;
        const hasKeyTerms = 'keyTerms' in payload;
        const hasImage = 'hasImage' in payload;
        
        if (hasContextualHeader && hasPrevNext && hasKeyTerms) {
          console.log(`   ✅ ENHANCED PREPROCESSING DETECTED`);
        } else {
          console.log(`   ⚠️  BASIC PREPROCESSING (missing: ${
            !hasContextualHeader ? 'contextualHeader ' : ''
          }${!hasPrevNext ? 'prev/nextChunkId ' : ''}${!hasKeyTerms ? 'keyTerms ' : ''})`.trim());
        }
        
        // Show sample text (truncated)
        if (payload.text) {
          console.log(`   Sample Text: "${payload.text.slice(0, 150)}..."`);
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectQdrant();
