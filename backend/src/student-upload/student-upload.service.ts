import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { SessionStoreService } from './session-store.service';
import { OcrProcessor } from './processors/ocr.processor';
import { PdfProcessor } from './processors/pdf.processor';
import { LlmService } from '../llm/llm.service';
import { ChatService } from '../chat/chat.service';
import { RetrievalService } from '../rag/services/retrieval.service';
import { BooksService } from '../books/books.service';
import { GradesService } from '../grades/grades.service';
import { SubjectsService } from '../subjects/subjects.service';
import { EnhancedChunkPayload } from '../rag/interfaces/chunk-payload.interface';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  success: boolean;
  fileName: string;
  chunksAdded: number;
  message: string;
}

interface SessionChunk {
  id: string;
  text: string;
  source: string;
  pageNumber?: number;
  chunkIndex: number;
}

interface ChatContext {
  grade?: string;
  subject?: string;
  sessionId?: string;
}

@Injectable()
export class StudentUploadService {
  private readonly logger = new Logger(StudentUploadService.name);
  private readonly CHUNK_SIZE = 300; // words per chunk
  private readonly CHUNK_OVERLAP = 50; // word overlap between chunks

  constructor(
    private readonly sessionStore: SessionStoreService,
    private readonly ocrProcessor: OcrProcessor,
    private readonly pdfProcessor: PdfProcessor,
    private readonly llmService: LlmService,
    @Inject(forwardRef(() => ChatService)) private readonly chatService: ChatService,
    private readonly retrievalService: RetrievalService,
    private readonly booksService: BooksService,
    private readonly gradesService: GradesService,
    private readonly subjectsService: SubjectsService,
  ) {}

  /**
   * Process an uploaded file (PDF or image)
   */
  async processUpload(studentId: string, file: Express.Multer.File): Promise<UploadResult> {
    this.logger.log(`Processing upload for student ${studentId}: ${file.originalname} (${file.mimetype})`);

    let extractedText: string;

    try {
      // 1. Extract text based on file type
      if (this.pdfProcessor.isPdf(file.mimetype)) {
        const pdfResult = await this.pdfProcessor.extractText(file.buffer);
        extractedText = pdfResult.text;
      } else if (this.ocrProcessor.isImage(file.mimetype)) {
        extractedText = await this.ocrProcessor.extractText(file.buffer, file.mimetype);
      } else {
        throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
      }

      // 2. Chunk the text
      const chunks = this.chunkText(extractedText, file.originalname);

      // 3. Store in session
      this.sessionStore.addChunks(studentId, chunks, file.originalname, file.mimetype);

      return {
        success: true,
        fileName: file.originalname,
        chunksAdded: chunks.length,
        message: `Successfully processed ${file.originalname}. Extracted ${chunks.length} chunks.`,
      };
    } catch (error) {
      this.logger.error(`Failed to process upload: ${error.message}`);
      return {
        success: false,
        fileName: file.originalname,
        chunksAdded: 0,
        message: `Failed to process ${file.originalname}: ${error.message}`,
      };
    }
  }


  /**
   * Ask a question using the student's uploaded content
   * Implements Google Lens-like cascading curriculum search:
   * 1. Search selected subject
   * 2. Search other subjects in same grade
   * 3. Fallback to general if no curriculum found
   */
  async askQuestion(
    studentId: string, 
    question: string,
    context?: ChatContext
  ): Promise<{ answer: string; sources: string[]; sessionId?: string; responseMode?: string }> {
    const chunks = this.sessionStore.getChunks(studentId);

    if (chunks.length === 0) {
      return {
        answer: "You haven't uploaded any content yet. Please upload a PDF, image, or handwritten notes first.",
        sources: [],
      };
    }

    // Get unique sources
    const uploadSources = [...new Set(chunks.map(c => c.source))];
    const uploadedContext = chunks.map(c => c.text).join('\n\n');

    // Extract key concepts and PREDICT SUBJECT
    const { terms: searchTerms, predictedSubject } = await this.extractSearchTerms(uploadedContext, question);
    this.logger.log(`🔍 Search terms: ${searchTerms.join(', ')} | Predicted Subject: ${predictedSubject}`);

    // Attempt cascading curriculum search
    let curriculumChunks: EnhancedChunkPayload[] = [];
    let curriculumSource = '';

    if (context?.grade && context?.subject) {
      // Resolve IDs to Titles
      let gradeTitle = context.grade;
      let subjectTitle = context.subject;

      // Check if Grade is ID
      if (/^[0-9a-fA-F]{24}$/.test(gradeTitle)) {
        try {
          // Force cast to any to avoid type mismatch if findById returns strict type
          const g = await this.gradesService.findById(gradeTitle) as any;
          if (g) gradeTitle = g.title;
        } catch (e) { this.logger.warn(`Failed to resolve grade ID ${gradeTitle}`); }
      }

      // Check if Subject is ID
      if (/^[0-9a-fA-F]{24}$/.test(subjectTitle)) {
        try {
           const s = await this.subjectsService.findById(subjectTitle) as any;
           if (s) subjectTitle = s.title;
        } catch (e) { this.logger.warn(`Failed to resolve subject ID ${subjectTitle}`); }
      }
      
      this.logger.log(`Resolving curriculum: ${gradeTitle} - ${subjectTitle}`);

      // Priority 1: Search selected subject
      const primaryCollection = this.retrievalService.getCollectionName(gradeTitle, subjectTitle);
      curriculumChunks = await this.searchCurriculum(primaryCollection, searchTerms);
      
      // Priority 2 (NEW): Check Predicted Subject Mismatch
      if (predictedSubject && predictedSubject.toLowerCase() !== subjectTitle.toLowerCase()) {
         this.logger.log(`⚠️ Detected mismatch! Selected: ${subjectTitle}, Predicted: ${predictedSubject}`);
         
         // Verify predicted subject exists in this grade
         const otherSubjects = await this.getOtherSubjectsInGrade(gradeTitle, subjectTitle);
         // Find exact match case-insensitive
         const matchedSubject = otherSubjects.find(s => s.toLowerCase().includes(predictedSubject.toLowerCase()) || predictedSubject.toLowerCase().includes(s.toLowerCase()));
         
         if (matchedSubject) {
             this.logger.log(`✅ Verified ${predictedSubject} matches available subject ${matchedSubject}. Searching...`);
             const secondaryCollection = this.retrievalService.getCollectionName(gradeTitle, matchedSubject);
             const secondaryChunks = await this.searchCurriculum(secondaryCollection, searchTerms);
             
             if (secondaryChunks.length > 0) {
                 // Prepend secondary chunks to ensure they appear in the top 5 context
                 curriculumChunks = [...secondaryChunks, ...curriculumChunks];
                 curriculumSource = `${gradeTitle} ${matchedSubject} & ${subjectTitle}`;
             }
         }
      }

      if (curriculumChunks.length > 0) {
        curriculumSource = curriculumSource || `${gradeTitle} ${subjectTitle}`;
        this.logger.log(`✅ Found ${curriculumChunks.length} chunks total`);
      } else {
        // Priority 2: Search other subjects in same grade
        this.logger.log(`🔄 No chunks in ${subjectTitle}, searching other subjects...`);
        const otherSubjects = await this.getOtherSubjectsInGrade(gradeTitle, subjectTitle);
        
        for (const subj of otherSubjects) {
          const altCollection = this.retrievalService.getCollectionName(gradeTitle, subj);
          curriculumChunks = await this.searchCurriculum(altCollection, searchTerms);
          
          if (curriculumChunks.length > 0) {
            curriculumSource = `${context.grade} ${subj}`;
            this.logger.log(`✅ Found ${curriculumChunks.length} chunks in ${curriculumSource}`);
            break;
          }
        }
      }
    }

    // Build response based on whether curriculum was found
    let prompt: string;
    let responseMode: string;
    let allSources = [...uploadSources];

    if (curriculumChunks.length > 0) {
      // CURRICULUM MODE: Use textbook + uploaded content
      responseMode = 'curriculum';
      const curriculumContext = curriculumChunks
        .slice(0, 5)
        .map(c => `[${c.unitTitle}]\n${c.text}`)
        .join('\n\n---\n\n');
      
      allSources.push(`📚 ${curriculumSource}`);
      
      prompt = `
You are Lumi, an expert tutor helping students understand their study materials using official curriculum.

📚 OFFICIAL TEXTBOOK CONTENT (${curriculumSource}):
${curriculumContext.slice(0, 15000)}

📎 STUDENT'S UPLOADED CONTENT:
${uploadedContext.slice(0, 10000)}

❓ STUDENT'S QUESTION:
${question}

INSTRUCTIONS:
Your goal is to provide a response that is visually attractive, readable, and structured like a premium study guide.

STRICT LAYOUT PATTERN (Use Markdown):

### 🧠 Concept Overview
- Present the core theory using bullet points
- Avoid dense paragraphs; keep it clean and conceptual
- Explain the "Why" before the "How"

### 🔢 Step-by-Step Solution

#### Step 1: [Descriptive Title]
- **Key Idea**: [Brief explanation]
- [Supporting detail or action taken]

#### Step 2: [Descriptive Title]
- **Formula**: [Insert formula if relevant]
- **Substitution**: [Show values being plugged in]

(Add steps as needed...)

### 🧮 Calculation
[Show each math step on its own line for clarity]
[Use bold for changed values or results]

### 📉 Visual Diagram (if applicable)
[Create a Mermaid diagram if the concept involves a process, flow, or hierarchy]
\`\`\`mermaid
graph TD
A[Start] --> B[Process]
\`\`\`

### 📊 Comparison Table (if applicable)
[Use a Markdown table for comparing items]
| Item A | Item B |
| :--- | :--- |
| Feature 1 | Feature 2 |

### ✅ Final Result
**[Clear, final answer statement]**

STYLE RULES:
- **No Wall of Text**: Convert paragraphs into bullet points or short grouped lines.
- **Visual Anchors**: Use the icons provided (🧠, 🔢, 🧮, ✅) for sections.
- **Spacing**: Keep sections distinct and spacious.
- **Curriculum**: Cite the official textbook unit when explaining concepts.
- **Visuals**: Use Mermaid diagrams for flows/processes and Tables for comparisons.

Answer:`;
    } else {
      // GENERAL MODE: Use only uploaded content (fallback)
      responseMode = 'general';
      
      prompt = `
You are a helpful tutor. The student has uploaded their own study materials.

📚 STUDENT'S UPLOADED CONTENT:
${uploadedContext.slice(0, 100000)}

❓ STUDENT'S QUESTION:
${question}

INSTRUCTIONS:
Your goal is to provide a response that is visually attractive, readable, and structured like a premium study guide.

STRICT LAYOUT PATTERN (Use Markdown):

### 🧠 Concept Overview
- Present the core theory using bullet points
- Avoid dense paragraphs

### 🔢 Step-by-Step Solution
- Use **Step 1**, **Step 2** headers
- Break down the logic clearly
- Use bullet points for details

### 🧮 Calculation
- Show math on separate lines
- Align equations clearly

### ✅ Final Result
**[Clear answer]**

STYLE RULES:
- No wall of text.
- Clean, modern spacing.
- Use only uploaded content context.

Answer:`;
    }

    try {
      const result = await this.llmService.generate(prompt, { temperature: 0.3 });
      
      // Persist to chat history if grade/subject provided
      let sessionId = context?.sessionId;
      if (context?.grade && context?.subject) {
        try {
          if (!sessionId) {
            const session = await this.chatService.createSession(
              studentId,
              `📎 Upload Q&A: ${question.slice(0, 40)}...`,
              { grade: context.grade, subject: context.subject }
            );
            sessionId = session._id.toString();
          }
          
          await this.chatService.addMessage(sessionId, 'user', question, {
            type: 'upload-qa',
            sources: allSources,
            responseMode,
          });
          await this.chatService.addMessage(sessionId, 'assistant', result.text, {
            type: 'upload-qa',
            sources: allSources,
            responseMode,
          });
          
          this.logger.log(`Saved upload Q&A to chat session ${sessionId} (mode: ${responseMode})`);
        } catch (err) {
          this.logger.warn(`Failed to save to chat history: ${err.message}`);
        }
      }

      return {
        answer: result.text,
        sources: allSources,
        sessionId,
        responseMode,
      };
    } catch (error) {
      this.logger.error(`Failed to generate answer: ${error.message}`);
      return {
        answer: `Sorry, I encountered an error: ${error.message}`,
        sources: uploadSources,
      };
    }
  }

  /**
   * Generate a quiz from the student's uploaded content
   */
  async generateQuiz(
    studentId: string, 
    numQuestions: number = 5,
    context?: ChatContext
  ): Promise<any> {
    const chunks = this.sessionStore.getChunks(studentId);

    if (chunks.length === 0) {
      throw new BadRequestException("No uploaded content found. Please upload materials first.");
    }

    const chunkContext = chunks.map(c => c.text).join('\n\n');
    const sources = [...new Set(chunks.map(c => c.source))];

    const prompt = `
You are a quiz generator. Create a quiz based on the student's uploaded study materials.

📚 STUDENT'S UPLOADED CONTENT:
${chunkContext.slice(0, 80000)}

Generate exactly ${numQuestions} questions.

RULES:
- Questions must be answerable from the content above
- Mix question types: multiple choice, true/false, fill-in-the-blank
- Include hints and explanations for each question

Return ONLY a valid JSON array:
[
  {
    "type": "mcq",
    "question": "Question text?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "answer": "A",
    "hint": "Helpful hint",
    "explanation": "Why this is correct"
  }
]
`;

    try {
      const result = await this.llmService.generate(prompt, { temperature: 0.5, format: 'json' });
      let cleanJson = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Find JSON array
      const start = cleanJson.indexOf('[');
      const end = cleanJson.lastIndexOf(']');
      if (start === -1 || end === -1) {
        throw new Error('Invalid quiz format');
      }
      
      const questions = JSON.parse(cleanJson.slice(start, end + 1));
      
      // Persist to chat history if grade/subject provided
      let sessionId = context?.sessionId;
      if (context?.grade && context?.subject) {
        try {
          if (!sessionId) {
            const session = await this.chatService.createSession(
              studentId,
              `📝 Upload Quiz (${numQuestions} questions)`,
              { grade: context.grade, subject: context.subject }
            );
            sessionId = session._id.toString();
          }
          
          await this.chatService.addMessage(sessionId, 'user', '📝 Generate quiz from my uploaded content', {
            type: 'upload-quiz',
            sources,
          });
          await this.chatService.addMessage(sessionId, 'assistant', `Generated ${questions.length} quiz questions from your uploaded content.`, {
            type: 'upload-quiz',
            numQuestions: questions.length,
            sources,
          });
          
          this.logger.log(`Saved upload quiz to chat session ${sessionId}`);
        } catch (err) {
          this.logger.warn(`Failed to save quiz to chat history: ${err.message}`);
        }
      }

      return {
        questions,
        source: 'student-uploaded',
        numQuestions: questions.length,
        sessionId,
      };
    } catch (error) {
      this.logger.error(`Failed to generate quiz: ${error.message}`);
      throw new BadRequestException(`Failed to generate quiz: ${error.message}`);
    }
  }

  /**
   * Get session info for a student
   */
  getSessionInfo(studentId: string) {
    return this.sessionStore.getSessionInfo(studentId);
  }

  /**
   * Clear a student's session
   */
  clearSession(studentId: string): void {
    this.sessionStore.clearSession(studentId);
  }

  /**
   * Chunk text into smaller pieces with overlap
   */
  private chunkText(text: string, source: string): SessionChunk[] {
    const words = text.split(/\s+/).filter(w => w.trim());
    const chunks: SessionChunk[] = [];

    for (let i = 0; i < words.length; i += this.CHUNK_SIZE - this.CHUNK_OVERLAP) {
      const chunkWords = words.slice(i, i + this.CHUNK_SIZE);
      if (chunkWords.length < 20) break; // Skip very small chunks

      chunks.push({
        id: uuidv4(),
        text: chunkWords.join(' '),
        source,
        chunkIndex: chunks.length,
      });
    }

    return chunks;
  }

  /**
   * Extract search terms from uploaded content using LLM
   */
  private async extractSearchTerms(content: string, question: string): Promise<{ terms: string[]; predictedSubject?: string }> {
    try {
      const prompt = `
Analyze the following content and question.
1. Extract 3-5 key search terms.
2. Predict the academic subject (e.g., Biology, History, Physics, Math, Geography, Chemistry).

CONTENT (first 2000 chars):
${content.slice(0, 2000)}

QUESTION:
${question}

Return ONLY a valid JSON object:
{
  "terms": ["term1", "term2", "term3"],
  "subject": "History"
}
`;
      const result = await this.llmService.generate(prompt, { temperature: 0.2 });
      const jsonStr = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);
      
      const terms = Array.isArray(data.terms) ? data.terms.slice(0, 5) : [question.slice(0, 50)];
      const predictedSubject = data.subject || undefined;
      
      return { terms, predictedSubject };
    } catch (error) {
      this.logger.warn(`Failed to extract search terms: ${error.message}`);
      return { 
        terms: question.split(/\s+/).filter(w => w.length > 3).slice(0, 3),
        predictedSubject: undefined 
      };
    }
  }

  /**
   * Search curriculum in Qdrant for matching chunks
   */
  private async searchCurriculum(
    collectionName: string,
    searchTerms: string[],
  ): Promise<EnhancedChunkPayload[]> {
    try {
      const query = searchTerms.join(' ');
      const result = await this.retrievalService.retrieve({
        collectionName,
        query,
        limit: 5,
        useSlidingWindow: false,
      });
      return result.chunks;
    } catch (error) {
      this.logger.warn(`Curriculum search failed for ${collectionName}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get other subjects in the same grade for cascading search
   */
  private async getOtherSubjectsInGrade(
    gradeTitle: string,
    excludeSubject: string,
  ): Promise<string[]> {
    try {
      // Find all books for this grade to get available subjects
      const allBooks = await this.booksService.findAll();
      const subjectsInGrade = allBooks
        .filter((book: any) => {
          const grade = book.grade as any;
          return grade?.title === gradeTitle;
        })
        .map((book: any) => {
          const subject = book.subject as any;
          return subject?.title;
        })
        .filter((title: string) => title && title !== excludeSubject);
      
      // Return unique subjects
      return [...new Set(subjectsInGrade)];
    } catch (error) {
      this.logger.warn(`Failed to get other subjects: ${error.message}`);
      return [];
    }
  }
}

