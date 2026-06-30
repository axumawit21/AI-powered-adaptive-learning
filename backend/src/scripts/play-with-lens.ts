
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { QdrantClient } from '@qdrant/js-client-rest';
import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../rag/services/retrieval.service';

// Mock Qdrant Provider string for the manual instance
// (We just need the client instance, the string doesn't matter for manual usage)

async function main() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error('Please provide an image path: npx ts-node src/scripts/play-with-lens.ts <path>');
    process.exit(1);
  }

  // 1. Initialize Services
  console.log('🚀 Initializing Services...');
  
  // LLM Service
  const llmService = new LlmService();

  // Qdrant Client
  const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
  const qdrantKey = process.env.QDRANT_API_KEY;
  const qdrantClient = new QdrantClient({ url: qdrantUrl, apiKey: qdrantKey });
  
  // Retrieval Service
  const retrievalService = new RetrievalService(qdrantClient, llmService);

  console.log('✅ Services Ready');

  // 2. Load Image
  const buffer = fs.readFileSync(imagePath);
  let mimeType = 'image/png';
  if (imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg')) {
    mimeType = 'image/jpeg';
  }

  // 3. Step 1: Vision - Concept Extraction
  console.log('\n👁️  Step 1: Analyzing Image for Concepts...');
  const extractionPrompt = `
    Analyze this image efficiently. 
    1. Identify the main Subject and Grade level if visible.
    2. Extract key distinctive terms, keywords, or the main question text that would be good search terms for a textbook.
    3. Return ONLY a JSON list of search queries.
    
    Example: ["quadratic formula derivation", "Grade 11 Mathematics", "solving for x"]
  `;

  // We use the raw generateWithVision from LlmService
  const visionResponse = await llmService.generateWithVision(buffer, extractionPrompt);
  
  let searchQueries: string[] = [];
  try {
    const jsonStr = visionResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
    searchQueries = JSON.parse(jsonStr);
    console.log('🔍 Extracted Queries:', searchQueries);
  } catch (e) {
    console.warn('⚠️ Failed to parse JSON from vision response. Using raw text as query.');
    searchQueries = [visionResponse.text.replace(/\n/g, ' ').substring(0, 100)];
  }

  // 4. Step 2: Curriculum Retrieval (RAG)
  console.log('\n📚 Step 2: Searching Curriculum...');
  
  // Try to find a grade/subject in the queries to guess collection name
  // This is a naive heuristic for the prototype. In real app, user selects Grade/Subject.
  // For now, we'll brute force or default to a known collection if specific keywords found,
  // or simply search a default if we can't guess. 
  // BETTER FOR PROTOTYPE: Just assume Grade 12 Math for the sample or search ALL if possible?
  // Qdrant retrieval requires a collection name.
  // Let's hardcode a collection for the DEMO based on the file we know we are testing,
  // OR infer it.
  // Let's rely on the extraction finding "Grade X" and "Subject Y".
  
  let collectionName = 'grade-12_mathematics'; // Default fallback
  
  const gradeMatch = searchQueries.join(' ').match(/Grade\s*(\d+)/i);
  const subjectMatch = searchQueries.join(' ').match(/(Math|Physics|Chemistry|Biology|History|Geography|Civics|Calculus)/i);
  
  if (gradeMatch && subjectMatch) {
      // rough map
     const grade = `Grade-${gradeMatch[1]}`; // e.g. Grade 12 -> Grade-12 ? No, usually "Grade 12" titles are specific
     // Actually retrievalService.getCollectionName uses "Grade 12", "Mathematics"
     collectionName = retrievalService.getCollectionName(`Grade ${gradeMatch[1]}`, subjectMatch[0]);
  }
  
  console.log(`📂 Target Collection: ${collectionName}`);

  // Retrieve for each query
  const allChunks: Set<string> = new Set();
  
  for (const query of searchQueries.slice(0, 3)) { // Limit to top 3 queries
      const results = await retrievalService.retrieve({
          collectionName,
          query,
          limit: 2,
          useSlidingWindow: false // keep it simple for now
      });
      
      results.chunks.forEach(c => {
          allChunks.add(`[Textbook - ${c.unitTitle}]\n${c.text}`);
      });
  }

  const retrievedContext = Array.from(allChunks).join('\n\n---\n\n');
  console.log(`📄 Retrieved ${allChunks.size} relevant textbook chunks.`);
  // console.log('Context Preview:', retrievedContext.substring(0, 200) + '...');

  // 5. Step 3: Final Solve
  console.log('\n🧠 Step 3: Solving with "Lens"...');
  
  const solvePrompt = `
    You are an expert tutor. Solve the problem shown in the image.
    
    1. READ the problem in the image carefully.
    2. USE the provided Textbook Context to explain the underlying concepts and formulas.
    3. PROVIDE a step-by-step solution.
    4. If the textbook context is relevant, CITE it (e.g., "As seen in Unit 3...").
    
    TEXTBOOK CONTEXT:
    ${retrievedContext.substring(0, 5000)}
    
    SOLVE IT:
  `;

  const finalResponse = await llmService.generateWithVision(buffer, solvePrompt);
  
  console.log('\n================ SOLUTION ================\n');
  console.log(finalResponse.text);
  console.log('\n==========================================\n');
}

main().catch(console.error);
