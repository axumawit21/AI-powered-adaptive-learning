import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExamPaper, ExamPaperDocument } from './schemas/exam-paper.schema';
import { ExamPaperQuestion, ExamPaperQuestionDocument } from './schemas/exam-paper-question.schema';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import { LlmService } from '../llm/llm.service';
import { PdfProcessor } from '../student-upload/processors/pdf.processor';
import { OcrProcessor } from '../student-upload/processors/ocr.processor';
import { 
  UploadExamPaperDto,
  CreateExamQuestionDto,
  UpdateExamQuestionDto,
  ApproveRejectQuestionDto,
  FilterExamPapersDto,
  StudentExamFilterDto 
} from './dto/exam-paper.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExamPaperService {
  private readonly logger = new Logger(ExamPaperService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'exam-papers');

  constructor(
    @InjectModel(ExamPaper.name) private examPaperModel: Model<ExamPaperDocument>,
    @InjectModel(ExamPaperQuestion.name) private questionModel: Model<ExamPaperQuestionDocument>,
    @InjectModel(Grade.name) private gradeModel: Model<Grade>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    private readonly llmService: LlmService,
    private readonly pdfProcessor: PdfProcessor,
    private readonly ocrProcessor: OcrProcessor,
  ) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Upload and process an exam paper
   */
  async uploadExamPaper(
    adminId: string,
    file: Express.Multer.File,
    dto: UploadExamPaperDto
  ): Promise<ExamPaperDocument> {
    this.logger.log(`Admin ${adminId} uploading exam paper: ${file.originalname}`);

    // Validate grade and subject
    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(dto.gradeId),
      this.subjectModel.findById(dto.subjectId),
    ]);

    if (!grade) throw new NotFoundException('Grade not found');
    if (!subject) throw new NotFoundException('Subject not found');

    // Save file
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.uploadsDir, fileName);
    
    fs.writeFileSync(filePath, file.buffer);

    // Create exam paper record
    const examPaper = await this.examPaperModel.create({
      uploadedBy: adminId,
      fileName: file.originalname,
      filePath: filePath,
      mimeType: file.mimetype,
      gradeId: new Types.ObjectId(dto.gradeId),
      gradeTitle: grade.title,
      subjectId: new Types.ObjectId(dto.subjectId),
      subjectTitle: subject.title,
      examYear: dto.examYear,
      status: 'processing',
    });

    // Process asynchronously
    const paperId = (examPaper._id as any).toString();
    this.processExamPaper(paperId).catch(err => {
      this.logger.error(`Failed to process exam paper ${paperId}: ${err.message}`);
    });

    return examPaper;
  }

  /**
   * Helper to add delay between API calls to respect rate limits
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process exam paper: extract text and questions
   */
  async processExamPaper(examPaperId: string): Promise<void> {
    this.logger.log(`Processing exam paper: ${examPaperId}`);
    
    const examPaper = await this.examPaperModel.findById(examPaperId);
    if (!examPaper) {
      throw new NotFoundException('Exam paper not found');
    }

    try {
      // Extract questions based on file type
      // Using TEXT-FIRST approach to minimize API calls (vision is expensive)
      let questions: any[] = [];
      const fileBuffer = fs.readFileSync(examPaper.filePath);

      if (this.pdfProcessor.isPdf(examPaper.mimeType)) {
        // Step 1: Try text extraction first (cheaper, works for most digital PDFs)
        this.logger.log('Step 1: Extracting text from PDF...');
        const result = await this.pdfProcessor.extractText(fileBuffer);
        const extractedText = result.text;
        this.logger.log(`PDF text extraction returned ${extractedText.length} characters`);
        
        if (extractedText.trim().length > 500) {
          // Good text content, use text-based extraction
          this.logger.log('Step 2: Extracting questions from text (API-efficient)...');
          questions = await this.extractQuestionsFromText(extractedText, examPaper);
          this.logger.log(`Text extraction yielded ${questions.length} questions`);
        }
        
        // Step 2: If text extraction failed or returned too few, try vision as fallback
        if (questions.length < 10) {
          this.logger.log('Text extraction insufficient. Trying Vision fallback...');
          try {
            // Add delay before vision call to respect rate limits
            await this.delay(2000);
            const visionQuestions = await this.extractQuestionsFromDocumentVision(fileBuffer, examPaper);
            if (visionQuestions.length > questions.length) {
              questions = visionQuestions;
              this.logger.log(`Vision extraction returned ${questions.length} questions`);
            }
          } catch (visionError) {
            this.logger.warn(`Vision extraction failed: ${visionError.message}. Continuing with text results.`);
          }
        }
      } else if (this.ocrProcessor.isImage(examPaper.mimeType)) {
        // For images, vision is the only option
        questions = await this.extractQuestionsFromDocumentVision(fileBuffer, examPaper);
      } else if (examPaper.mimeType.includes('word') || examPaper.mimeType.includes('document')) {
        // For DOCX, use text extraction
        const extractedText = await this.extractDocxText(fileBuffer);
        questions = await this.extractQuestionsFromText(extractedText, examPaper);
      } else {
        throw new BadRequestException(`Unsupported file type: ${examPaper.mimeType}`);
      }

      this.logger.log(`Total questions extracted: ${questions.length}`);

      if (questions.length === 0) {
        examPaper.status = 'pending_review';
        examPaper.processingError = 'No questions could be extracted from the document';
        await examPaper.save();
        return;
      }

      // Generate hints and explanations for each question
      const enrichedQuestions = await this.enrichQuestions(questions, examPaper);

      // Save questions to database
      for (const q of enrichedQuestions) {
        await this.questionModel.create({
          examPaperId: examPaper._id,
          questionNumber: q.questionNumber,
          question: q.question,
          options: q.options,
          answer: q.answer,
          hint: q.hint,
          explanation: q.explanation,
          approvalStatus: q.needsReview ? 'needs_review' : 'pending',
          originalQuestion: q.question,
          originalOptions: q.options,
          hasImage: q.hasImage || false, // Flag for questions with diagrams/figures
        });
      }

      // Update exam paper status
      examPaper.questionsCount = enrichedQuestions.length;
      examPaper.status = 'pending_review';
      examPaper.processedAt = new Date();
      await examPaper.save();

      this.logger.log(`Successfully processed exam paper with ${enrichedQuestions.length} questions`);

    } catch (error) {
      this.logger.error(`Error processing exam paper: ${error.message}`);
      examPaper.status = 'pending_review';
      examPaper.processingError = error.message;
      await examPaper.save();
    }
  }

  /**
   * Extract DOCX text (simplified - uses Gemini for document understanding)
   */
  private async extractDocxText(buffer: Buffer): Promise<string> {
    // For simplicity, we'll use Gemini vision on the document
    // In production, you might want to use mammoth.js for proper DOCX parsing
    const base64 = buffer.toString('base64');
    const result = await this.llmService.generateWithImage(
      'Extract all text from this document exactly as it appears. Preserve formatting and structure.',
      base64,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    return result.text;
  }

  /**
   * Extract text from PDF using Gemini Vision (fallback for scanned PDFs)
   */
  private async extractPdfWithVision(buffer: Buffer): Promise<string> {
    const base64 = buffer.toString('base64');
    const result = await this.llmService.generateWithImage(
      'Extract all text from this exam paper document exactly as it appears. Identify it is an exam paper.',
      base64,
      'application/pdf'
    );
    return result.text;
  }

  /**
   * Extract Questions directly from Document using Vision (bypasses text extraction)
   * This is optimal for scanned PDFs/Images
   */
  private async extractQuestionsFromDocumentVision(
      buffer: Buffer, 
      examPaper: ExamPaperDocument
  ): Promise<any[]> {
    const base64 = buffer.toString('base64');
    
    // Construct simplified prompt for Vision
    const prompt = `You are an AI analyzing an image/PDF of an Ethiopian ${examPaper.gradeTitle} ${examPaper.subjectTitle} exam paper from ${examPaper.examYear}.
    
TASK: Visually identify and extract ALL multiple-choice questions from this document. You MUST extract EVERY question - do NOT skip any.

OUTPUT FORMAT (strict JSON array):
[
  {
    "questionNumber": 1,
    "question": "The question text detected from image?",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "answer": "B", 
    "needsReview": false,
    "hasImage": false,
    "imageDescription": ""
  }
]

CRITICAL RULES:
- You MUST extract EVERY question from question 1 to the last question. Do NOT skip ANY question.
- Extract text exactly as visible.
- If answer is marked/circled, use it. If not, solve it.
- If text is unreadable, set needsReview: true but still include the question.
- If the question includes a diagram, figure, graph, chart, chemical structure, molecular formula, or any image:
  * Set hasImage: true
  * Describe the image in imageDescription (e.g., "Chemical structure of 3,7-dimethyl-3-chlorooctane", "Graph showing velocity vs time")
  * Include "[See diagram]" or "[See structure]" in the question text where the image appears
  * NEVER skip questions just because they contain images - include them with hasImage: true
- Return ONLY JSON.`;

    try {
      this.logger.log(`Sending document to Gemini Vision for direct question extraction...`);
      // Use application/pdf for PDFs, or let generateWithImage handle it
      const mimeType = this.pdfProcessor.isPdf(examPaper.mimeType) ? 'application/pdf' : examPaper.mimeType;
      
      const result = await this.llmService.generateWithImage(
        prompt,
        base64,
        mimeType
      );
      
      const questions = this.parseJsonResponse(result.text);
      return Array.isArray(questions) ? questions : [];
    } catch (error) {
      this.logger.error(`Vision Question Extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract MCQ questions from text using LLM
   */
  private async extractQuestionsFromText(
    text: string, 
    examPaper: ExamPaperDocument
  ): Promise<any[]> {
    const prompt = `You are analyzing an Ethiopian ${examPaper.gradeTitle} ${examPaper.subjectTitle} exam paper from ${examPaper.examYear}.

TASK: Extract ALL multiple-choice questions from the following exam text. You MUST extract EVERY question - do NOT skip any.

CRITICAL RULES:
- Extract ALL questions from question 1 to the last question. Do NOT skip ANY question number.
- Extract ONLY multiple-choice questions with A, B, C, D options
- Extract the question text EXACTLY as written
- Extract all options EXACTLY as written, in format: "A. option text", "B. option text", etc.
- For each question, identify the CORRECT answer if marked in the document
- If the correct answer is NOT marked, make your best educated guess based on Ethiopian curriculum
- If a question is unclear, damaged, or unreadable, set needsReview to true but STILL INCLUDE IT
- If a question references a diagram, figure, graph, chemical structure, or image that is not in the text:
  * Set hasImage to true
  * Include "[See diagram]" or "[See figure]" in the question text
  * NEVER skip questions just because they contain images
- Do NOT invent or modify questions

OUTPUT FORMAT (strict JSON array):
[
  {
    "questionNumber": 1,
    "question": "The question text here?",
    "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
    "answer": "B",
    "needsReview": false,
    "hasImage": false
  }
]

EXAM TEXT:
${text}

IMPORTANT: Return ONLY the JSON array, no explanation or markdown. Include ALL questions - the count should match the total in the exam.`;

    try {
      this.logger.log(`Sending extracted text (${text.length} chars) to LLM for question extraction...`);
      
      // Log first 500 chars of text for debugging
      this.logger.debug(`Text preview: ${text.substring(0, 500)}...`);
      
      const response = await this.llmService.generate(prompt);
      
      this.logger.log(`LLM response received (${response.text?.length || 0} chars)`);
      this.logger.debug(`LLM response preview: ${response.text?.substring(0, 500)}...`);
      
      const questions = this.parseJsonResponse(response.text);
      
      if (!Array.isArray(questions)) {
        this.logger.warn('LLM response was not a valid array');
        return [];
      }
      
      this.logger.log(`Successfully extracted ${questions.length} questions from LLM response`);
      return questions;
    } catch (error) {
      this.logger.error(`Failed to extract questions: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      return [];
    }
  }

  /**
 * Enrich questions with hints and explanations
 * Includes rate limiting to avoid quota issues
 */
private async enrichQuestions(
  questions: any[], 
  examPaper: ExamPaperDocument
): Promise<any[]> {
  const enrichedQuestions: any[] = [];
  const totalQuestions = questions.length;

  this.logger.log(`Starting enrichment for ${totalQuestions} questions (with rate limiting)...`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    
    // Add delay between questions to respect rate limits (except for first)
    if (i > 0) {
      await this.delay(2000); // 2 second delay between API calls
    }

    try {
      this.logger.log(`Enriching question ${i + 1}/${totalQuestions}...`);
      
      // Build question context - include image description if available for LLM to reference
      const imageContext = q.hasImage && q.imageDescription 
        ? `\n\nIMAGE DESCRIPTION: ${q.imageDescription}\n(The question includes a visual element described above. Reference it naturally in your hint and explanation.)`
        : '';
      
      const prompt = `You are an Ethiopian education expert for ${examPaper.gradeTitle} ${examPaper.subjectTitle}.

QUESTION: ${q.question}${imageContext}
OPTIONS: ${q.options.join(' | ')}
CORRECT ANSWER: ${q.answer}

TASKS:
1. Generate a SHORT HINT (1-2 sentences) that guides student thinking WITHOUT revealing the answer
2. Generate a CLEAR EXPLANATION (2-3 sentences) of why the answer is correct, aligned with Ethiopian curriculum

RULES:
- Use simple language appropriate for Ethiopian students at this grade level
- Do not include advanced concepts
- Be accurate and educational
- No markdown or special formatting
- If the question has an image, reference it naturally (e.g., "Looking at the diagram..." or "In the structure shown...")

OUTPUT FORMAT (strict JSON):
{
  "hint": "Your hint here",
  "explanation": "Your explanation here"
}

Return ONLY the JSON object.`;

        const response = await this.llmService.generate(prompt);
        const parsed = this.parseJsonResponse(response.text);
        
        enrichedQuestions.push({
          ...q,
          hint: parsed.hint || 'Think carefully about what the question is asking.',
          explanation: parsed.explanation || `The correct answer is ${q.answer}.`,
        });
      } catch (error) {
        this.logger.warn(`Failed to enrich question ${q.questionNumber}: ${error.message}`);
        enrichedQuestions.push({
          ...q,
          hint: 'Think carefully about what the question is asking.',
          explanation: `The correct answer is ${q.answer}.`,
        });
      }
    }

    this.logger.log(`Enrichment complete for ${enrichedQuestions.length} questions.`);
    return enrichedQuestions;
  }

  /**
   * Parse JSON from LLM response
   */
  private parseJsonResponse(text: string): any {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    return JSON.parse(cleaned);
  }

  // ===== ADMIN REVIEW METHODS =====

  /**
   * List exam papers with filters
   */
  async listExamPapers(dto: FilterExamPapersDto): Promise<{
    papers: ExamPaperDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query: any = {};
    
    if (dto.gradeId) query.gradeId = new Types.ObjectId(dto.gradeId);
    if (dto.subjectId) query.subjectId = new Types.ObjectId(dto.subjectId);
    if (dto.examYear) query.examYear = dto.examYear;
    if (dto.status) query.status = dto.status;

    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const [papers, total] = await Promise.all([
      this.examPaperModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.examPaperModel.countDocuments(query),
    ]);

    return { papers, total, page, limit };
  }

  /**
   * Get questions for review
   */
  async getQuestionsForReview(
    examPaperId: string, 
    approvalStatus?: string
  ): Promise<ExamPaperQuestionDocument[]> {
    const query: any = { examPaperId: new Types.ObjectId(examPaperId) };
    if (approvalStatus) query.approvalStatus = approvalStatus;

    return this.questionModel.find(query).sort({ questionNumber: 1 });
  }

  /**
   * Create a manual question
   */
  async createQuestion(
    examPaperId: string,
    adminId: string,
    dto: CreateExamQuestionDto
  ): Promise<ExamPaperQuestionDocument> {
    const examPaper = await this.examPaperModel.findById(examPaperId);
    if (!examPaper) throw new NotFoundException('Exam paper not found');

    const question = new this.questionModel({
      examPaperId: new Types.ObjectId(examPaperId),
      questionNumber: dto.questionNumber,
      question: dto.question || 'New Question',
      options: dto.options || [],
      answer: dto.answer || '',
      hint: dto.hint || '',
      explanation: dto.explanation || '',
      hasImage: false,
      status: 'pending_review',
      approvalStatus: 'needs_review',
      isEdited: true,
      editedBy: adminId,
      editedAt: new Date(),
    });

    const savedQuestion = await question.save();

    // Update exam paper questions count
    await this.examPaperModel.findByIdAndUpdate(examPaperId, {
      $inc: { questionsCount: 1 }
    });

    return savedQuestion;
  }

  /**
   * Update a question
   */
  async updateQuestion(
    questionId: string, 
    adminId: string,
    dto: UpdateExamQuestionDto
  ): Promise<ExamPaperQuestionDocument> {
    this.logger.log(`DEBUG updateQuestion called for ${questionId} with DTO: ${JSON.stringify(dto)}`);
    const question = await this.questionModel.findById(questionId);
    if (!question) throw new NotFoundException('Question not found');

    // Validation: if hasImage is true, imageDescription is required
    const hasImage = dto.hasImage !== undefined ? dto.hasImage : question.hasImage;
    const imageDescription = dto.imageDescription !== undefined ? dto.imageDescription : question.imageDescription;
    
    if (hasImage && !imageDescription) {
      throw new BadRequestException('Image description is required when an image is present. Please provide a textual description of the image for accessibility and LLM context.');
    }

    if (dto.question) question.question = dto.question;
    if (dto.options) question.options = dto.options;
    if (dto.answer) question.answer = dto.answer;
    if (dto.hint) question.hint = dto.hint;
    if (dto.explanation) question.explanation = dto.explanation;
    if (dto.reviewerComment) question.reviewerComment = dto.reviewerComment;
    
    // Handle image-related fields
    if (dto.imageUrl !== undefined) question.imageUrl = dto.imageUrl;
    if (dto.hasImage !== undefined) question.hasImage = dto.hasImage;
    if (dto.imageDescription !== undefined) question.imageDescription = dto.imageDescription;
    
    // Handle option image fields
    if (dto.optionImageUrls !== undefined) question.optionImageUrls = dto.optionImageUrls;
    if (dto.optionImageDescriptions !== undefined) question.optionImageDescriptions = dto.optionImageDescriptions;

    question.editedBy = adminId;
    question.editedAt = new Date();

    return question.save();

  }

  /**
   * Approve or reject a question
   */
  async setQuestionStatus(
    questionId: string,
    adminId: string,
    dto: ApproveRejectQuestionDto
  ): Promise<ExamPaperQuestionDocument> {
    const question = await this.questionModel.findById(questionId);
    if (!question) throw new NotFoundException('Question not found');

    question.approvalStatus = dto.status;
    if (dto.reviewerComment) question.reviewerComment = dto.reviewerComment;
    question.editedBy = adminId;
    question.editedAt = new Date();

    await question.save();

    // Update exam paper approved count
    await this.updateExamPaperCounts(question.examPaperId.toString());

    return question;
  }

  /**
   * Approve all pending questions in an exam
   */
  async approveAllQuestions(examPaperId: string, adminId: string): Promise<void> {
    const result = await this.questionModel.updateMany(
      { 
        examPaperId: new Types.ObjectId(examPaperId),
        approvalStatus: { $in: ['pending', 'needs_review'] }
      },
      {
        approvalStatus: 'approved',
        editedBy: adminId,
        editedAt: new Date(),
      }
    );

    this.logger.log(`Approved ${result.modifiedCount} questions for exam ${examPaperId}`);

    await this.updateExamPaperCounts(examPaperId);
  }

  /**
   * Update exam paper question counts and status
   */
  private async updateExamPaperCounts(examPaperId: string): Promise<void> {
    const [total, approved, rejected] = await Promise.all([
      this.questionModel.countDocuments({ examPaperId: new Types.ObjectId(examPaperId) }),
      this.questionModel.countDocuments({ 
        examPaperId: new Types.ObjectId(examPaperId),
        approvalStatus: 'approved'
      }),
      this.questionModel.countDocuments({ 
        examPaperId: new Types.ObjectId(examPaperId),
        approvalStatus: 'rejected'
      }),
    ]);
    
    this.logger.log(`DEBUG updateExamPaperCounts: total=${total}, approved=${approved}, rejected=${rejected} for ${examPaperId}`);

    const examPaper = await this.examPaperModel.findById(examPaperId);
    if (examPaper) {
      examPaper.questionsCount = total;
      examPaper.approvedQuestionsCount = approved;
      
      // Update status based on approval
      // If all questions are reviewed (approved or rejected) and we have at least one approved question,
      // mark the exam as approved/ready.
      const reviewedCount = approved + rejected;
      
      if (reviewedCount === total && approved > 0) {
        examPaper.status = 'approved';
      } else if (approved > 0) {
        examPaper.status = 'pending_review';
      }
      
      await examPaper.save();
    }
  }

  // ===== STUDENT ACCESS METHODS =====

  /**
   * Get approved exams for students
   */
  async getApprovedExamsForStudent(dto: StudentExamFilterDto): Promise<ExamPaperDocument[]> {
    const query: any = { status: 'approved', approvedQuestionsCount: { $gt: 0 } };
    
    if (dto.gradeId) query.gradeId = new Types.ObjectId(dto.gradeId);
    if (dto.subjectId) query.subjectId = new Types.ObjectId(dto.subjectId);
    if (dto.examYear) query.examYear = dto.examYear;

    return this.examPaperModel.find(query).sort({ examYear: -1, subjectTitle: 1 });
  }

  /**
   * Start an exam session for a student
   */
  async startExamSession(studentId: string, examPaperId: string): Promise<{
    examId: string;
    title: string;
    questions: any[];
    totalQuestions: number;
  }> {
    const examPaper = await this.examPaperModel.findById(examPaperId);
    if (!examPaper) throw new NotFoundException('Exam not found');
    if (examPaper.status !== 'approved') {
      throw new BadRequestException('This exam is not yet available');
    }

    // Get approved questions
    const questions = await this.questionModel.find({
      examPaperId: new Types.ObjectId(examPaperId),
      approvalStatus: 'approved',
    }).sort({ questionNumber: 1 });

    // Debug log for checking image data
    const q23 = questions.find(q => q.questionNumber === 23);
    if (q23) {
      this.logger.log(`DEBUG Check Q23: hasImage=${q23.hasImage}, imageUrl=${q23.imageUrl}, id=${q23._id}`);
    } else {
      this.logger.log(`DEBUG Check Q23: Not found in approved questions`);
    }

    if (questions.length === 0) {
      throw new BadRequestException('No approved questions in this exam');
    }

    return {
      examId: examPaperId,
      title: `${examPaper.subjectTitle} - ${examPaper.examYear} Exam`,
      questions: questions.map(q => ({
        id: (q._id as any).toString(),
        questionNumber: q.questionNumber,
        question: q.question,
        options: q.options,
        answer: q.answer, // Include for client-side validation
        hint: q.hint,
        explanation: q.explanation,
        imageUrl: q.imageUrl || null, // Include image URL if present
        hasImage: q.hasImage || false, // Flag for frontend
        imageDescription: q.imageDescription || null, // Include for accessibility
        optionImageUrls: q.optionImageUrls || [null, null, null, null], // Option images
        optionImageDescriptions: q.optionImageDescriptions || [null, null, null, null], // Option image descriptions
      })),
      totalQuestions: questions.length,
    };

  }

  /**
   * Get exam paper by ID
   */
  async getExamPaperById(id: string): Promise<ExamPaperDocument> {
    const paper = await this.examPaperModel.findById(id);
    if (!paper) throw new NotFoundException('Exam paper not found');
    return paper;
  }

  /**
   * Reprocess an exam paper
   */
  async reprocessExamPaper(examPaperId: string): Promise<void> {
    const examPaper = await this.examPaperModel.findById(examPaperId);
    if (!examPaper) throw new NotFoundException('Exam paper not found');

    // Delete existing questions
    await this.questionModel.deleteMany({ examPaperId: new Types.ObjectId(examPaperId) });

    // Reset status
    examPaper.status = 'processing';
    examPaper.questionsCount = 0;
    examPaper.approvedQuestionsCount = 0;
    examPaper.processingError = undefined;
    await examPaper.save();

    // Reprocess
    this.processExamPaper(examPaperId).catch(err => {
      this.logger.error(`Failed to reprocess exam paper ${examPaperId}: ${err.message}`);
    });
  }

  /**
   * Delete an exam paper
   */
  async deleteExamPaper(examPaperId: string): Promise<void> {
    const examPaper = await this.examPaperModel.findById(examPaperId);
    if (!examPaper) throw new NotFoundException('Exam paper not found');

    // Delete file
    if (fs.existsSync(examPaper.filePath)) {
      fs.unlinkSync(examPaper.filePath);
    }

    // Delete questions
    await this.questionModel.deleteMany({ examPaperId: new Types.ObjectId(examPaperId) });

    // Delete exam paper
    await this.examPaperModel.findByIdAndDelete(examPaperId);
  }

  /**
   * Get dashboard stats for admin
   */
  async getDashboardStats(): Promise<{
    processing: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    totalQuestions: number;
  }> {
    const [processing, pendingReview, approved, rejected, totalQuestions] = await Promise.all([
      this.examPaperModel.countDocuments({ status: 'processing' }),
      this.examPaperModel.countDocuments({ status: 'pending_review' }),
      this.examPaperModel.countDocuments({ status: 'approved' }),
      this.examPaperModel.countDocuments({ status: 'rejected' }),
      this.questionModel.countDocuments({ approvalStatus: 'approved' }),
    ]);

    return { processing, pendingReview, approved, rejected, totalQuestions };
  }

  // ===== IMAGE ANALYSIS METHODS =====

  private readonly questionImagesDir = path.join(process.cwd(), 'uploads', 'exam-questions');

  /**
   * Analyze a question image using LLM Vision
   * Generates: imageDescription, answer, hint, explanation
   * Vision is used ONCE during admin upload, then students use cached text
   */
  async analyzeQuestionImage(
    questionId: string,
    file: Express.Multer.File,
    adminId: string
  ): Promise<ExamPaperQuestionDocument> {
    const question = await this.questionModel.findById(questionId);
    if (!question) throw new NotFoundException('Question not found');

    // Get exam paper for context
    const examPaper = await this.examPaperModel.findById(question.examPaperId);
    if (!examPaper) throw new NotFoundException('Exam paper not found');

    this.logger.log(`Analyzing image for question ${questionId}...`);

    // Ensure question images directory exists
    if (!fs.existsSync(this.questionImagesDir)) {
      fs.mkdirSync(this.questionImagesDir, { recursive: true });
    }

    // Save the image file
    const fileExt = path.extname(file.originalname);
    const fileName = `${questionId}-${uuidv4()}${fileExt}`;
    const filePath = path.join(this.questionImagesDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Generate relative URL for frontend
    const imageUrl = `/uploads/exam-questions/${fileName}`;

    // Use Vision to analyze the image
    const base64Image = file.buffer.toString('base64');
    
    const prompt = `You are an Ethiopian education expert analyzing a question image for ${examPaper.gradeTitle} ${examPaper.subjectTitle}.

CURRENT QUESTION TEXT: ${question.question}
CURRENT OPTIONS: ${question.options.join(' | ')}

TASK: Analyze this image (which is part of the question above) and provide:
1. A detailed DESCRIPTION of what the image shows (for accessibility and LLM context)
2. The CORRECT ANSWER (A, B, C, or D) based on the image content
3. A SHORT HINT (1-2 sentences) that guides student thinking WITHOUT revealing the answer
4. A CLEAR EXPLANATION (2-3 sentences) of why the answer is correct, referencing the image naturally

RULES:
- Be specific about what's in the image (e.g., "A molecular structure showing...", "A graph depicting...")
- Reference the image naturally in hint and explanation
- Use simple language appropriate for Ethiopian students
- Align with Ethiopian curriculum

OUTPUT FORMAT (strict JSON):
{
  "imageDescription": "Detailed description of the image",
  "answer": "B",
  "hint": "Your hint here",
  "explanation": "Your explanation here, referencing the image"
}

Return ONLY the JSON object.`;

    try {
      const result = await this.llmService.generateWithImage(
        prompt,
        base64Image,
        file.mimetype
      );

      const parsed = this.parseJsonResponse(result.text);
      
      this.logger.log(`DEBUG analyzeQuestionImage Parsed Result: ${JSON.stringify(parsed)}`);
      this.logger.log(`DEBUG analyzeQuestionImage URL: ${imageUrl}`);

      // Update question with analyzed data
      question.imageUrl = imageUrl;
      question.hasImage = true;
      question.imageDescription = parsed.imageDescription || 'Image for this question';
      
      // Only update if LLM provided values
      if (parsed.answer) question.answer = parsed.answer;
      if (parsed.hint) question.hint = parsed.hint;
      if (parsed.explanation) question.explanation = parsed.explanation;
      
      question.editedBy = adminId;
      question.editedAt = new Date();

      await question.save();
      
      this.logger.log(`Successfully analyzed image for question ${questionId}`);
      return question;

    } catch (error) {
      // Clean up uploaded file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.logger.error(`Failed to analyze image: ${error.message}`);
      throw new InternalServerErrorException(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze an option image using LLM Vision
   * Generates: imageDescription for the specific option
   */
  async analyzeOptionImage(
    questionId: string,
    optionIndex: number, // 0=A, 1=B, 2=C, 3=D
    file: Express.Multer.File,
    adminId: string
  ): Promise<ExamPaperQuestionDocument> {
    const question = await this.questionModel.findById(questionId);
    if (!question) throw new NotFoundException('Question not found');

    // Get exam paper for context
    const examPaper = await this.examPaperModel.findById(question.examPaperId);
    if (!examPaper) throw new NotFoundException('Exam paper not found');

    const optionLabels = ['A', 'B', 'C', 'D'];
    const optionLabel = optionLabels[optionIndex];
    
    this.logger.log(`Analyzing option ${optionLabel} image for question ${questionId}...`);

    // Ensure question images directory exists
    if (!fs.existsSync(this.questionImagesDir)) {
      fs.mkdirSync(this.questionImagesDir, { recursive: true });
    }

    // Save the image file
    const fileExt = path.extname(file.originalname);
    const fileName = `${questionId}-option-${optionLabel}-${uuidv4()}${fileExt}`;
    const filePath = path.join(this.questionImagesDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Generate relative URL for frontend
    const imageUrl = `/uploads/exam-questions/${fileName}`;

    // Use Vision to analyze the image
    const base64Image = file.buffer.toString('base64');
    
    const prompt = `You are an Ethiopian education expert analyzing an option image for ${examPaper.gradeTitle} ${examPaper.subjectTitle}.

QUESTION: ${question.question}
THIS IS OPTION ${optionLabel}'s IMAGE.

TASK: Describe what this image shows (for accessibility and LLM context).

RULES:
- Be specific about what's in the image (e.g., "Molecular structure of benzene showing a hexagonal ring with alternating double bonds", "Graph depicting velocity vs time with linear increase")
- Keep the description concise (1-2 sentences)
- Use simple language appropriate for Ethiopian students

OUTPUT FORMAT (strict JSON):
{
  "imageDescription": "Detailed description of option ${optionLabel}'s image"
}

Return ONLY the JSON object.`;

    try {
      const result = await this.llmService.generateWithImage(
        prompt,
        base64Image,
        file.mimetype
      );

      const parsed = this.parseJsonResponse(result.text);
      
      this.logger.log(`DEBUG analyzeOptionImage Parsed Result: ${JSON.stringify(parsed)}`);

      // Initialize arrays if not present
      if (!question.optionImageUrls) {
        question.optionImageUrls = [null, null, null, null];
      }
      if (!question.optionImageDescriptions) {
        question.optionImageDescriptions = [null, null, null, null];
      }

      // Update the specific option's image data
      question.optionImageUrls[optionIndex] = imageUrl;
      question.optionImageDescriptions[optionIndex] = parsed.imageDescription || `Image for option ${optionLabel}`;
      
      question.editedBy = adminId;
      question.editedAt = new Date();

      await question.save();
      
      this.logger.log(`Successfully analyzed option ${optionLabel} image for question ${questionId}`);
      
      return question;

    } catch (error) {
      // Clean up uploaded file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.logger.error(`Failed to analyze option image: ${error.message}`);
      throw new InternalServerErrorException(`Option image analysis failed: ${error.message}`);
    }
  }
}

