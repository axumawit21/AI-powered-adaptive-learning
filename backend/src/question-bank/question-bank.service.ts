import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Question, QuestionDocument, DifficultyLevel, QuestionType } from './schemas/question.schema';
import { StudentAttemptedQuestions, StudentAttemptedQuestionsDocument } from './schemas/student-attempted-questions.schema';
import { 
  CreateQuestionDto, 
  GenerateQuestionsDto, 
  FetchQuestionsDto, 
  RecordAttemptDto,
  QuestionBankStatsDto,
  CheckAvailableQuestionsDto
} from './dto/question-bank.dto';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import { Book } from '../books/book.schema';
import { QDRANT } from '../common/qdrant.provider';
import { QdrantClient } from '@qdrant/js-client-rest';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class QuestionBankService {
  private readonly logger = new Logger(QuestionBankService.name);

  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(StudentAttemptedQuestions.name) private attemptedModel: Model<StudentAttemptedQuestionsDocument>,
    @InjectModel(Grade.name) private gradeModel: Model<Grade>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @Inject(QDRANT) private readonly qdrant: QdrantClient,
    private readonly llmService: LlmService,
  ) {}

  // ==================== QUESTION CREATION ====================

  /**
   * Create a single question manually
   */
  async createQuestion(dto: CreateQuestionDto): Promise<QuestionDocument> {
    // Resolve Grade and Subject titles
    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(dto.gradeId),
      this.subjectModel.findById(dto.subjectId),
    ]);

    if (!grade) throw new NotFoundException(`Grade not found: ${dto.gradeId}`);
    if (!subject) throw new NotFoundException(`Subject not found: ${dto.subjectId}`);

    const question = new this.questionModel({
      ...dto,
      questionId: `Q_${uuidv4()}`,
      gradeId: new Types.ObjectId(dto.gradeId),
      subjectId: new Types.ObjectId(dto.subjectId),
      gradeTitle: grade.title,
      subjectTitle: subject.title,
    });

    return question.save();
  }

  /**
   * Bulk create questions from an array
   */
  async bulkCreateQuestions(questions: CreateQuestionDto[]): Promise<{ created: number; errors: any[] }> {
    const results = { created: 0, errors: [] as any[] };
    
    for (const q of questions) {
      try {
        await this.createQuestion(q);
        results.created++;
      } catch (err) {
        results.errors.push({ question: q.question?.substring(0, 50), error: err.message });
      }
    }

    return results;
  }

  /**
   * Generate questions using LLM for a specific unit
   * This is the one-time generation that stores questions permanently
   */
  async generateQuestions(dto: GenerateQuestionsDto): Promise<{ generated: number; questions: QuestionDocument[] }> {
    const { 
      subjectId, 
      gradeId, 
      unitNumber, 
      unitTitle, 
      subunitNumber, 
      subunitTitle,
      questionsPerDifficulty = 10,
      questionTypes = ['mcq', 'true-false', 'fill-blank'],
      difficulties = ['easy', 'medium', 'hard'],
      bookId
    } = dto;

    // Resolve Grade and Subject
    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(gradeId),
      this.subjectModel.findById(subjectId),
    ]);

    if (!grade) throw new NotFoundException(`Grade not found: ${gradeId}`);
    if (!subject) throw new NotFoundException(`Subject not found: ${subjectId}`);

    this.logger.log(`Generating questions for ${grade.title} - ${subject.title} - Unit ${unitNumber}: ${unitTitle}`);

    // Fetch context from Qdrant if available
    let context: string[] = [];
    try {
      const collectionName = this.getCollectionName(grade.title, subject.title);
      context = await this.fetchContextFromQdrant(collectionName, unitTitle, subunitTitle);
    } catch (err) {
      this.logger.warn(`Could not fetch context from Qdrant: ${err.message}`);
    }

    const generatedQuestions: QuestionDocument[] = [];

    // Generate questions for each difficulty level
    for (const difficulty of difficulties) {
      for (const qType of questionTypes) {
        const count = Math.ceil(questionsPerDifficulty / questionTypes.length);
        
        try {
          const prompt = this.buildGenerationPrompt({
            gradeTitle: grade.title,
            subjectTitle: subject.title,
            unitTitle,
            subunitTitle,
            difficulty: difficulty as DifficultyLevel,
            questionType: qType as QuestionType,
            count,
            context,
          });

          const response = await this.llmService.generate(prompt, { temperature: 0.7 });
          const parsedQuestions = this.parseLLMResponse(response.text);

          // Save each question
          for (const q of parsedQuestions) {
            try {
              const question = new this.questionModel({
                questionId: `Q_${uuidv4()}`,
                gradeId: new Types.ObjectId(gradeId),
                subjectId: new Types.ObjectId(subjectId),
                gradeTitle: grade.title,
                subjectTitle: subject.title,
                unitNumber,
                unitTitle,
                subunitNumber,
                subunitTitle,
                type: qType,
                difficulty,
                question: q.question,
                options: (qType === 'true-false' && (!q.options || q.options.length === 0)) 
                  ? ['True', 'False'] 
                  : (q.options || []),
                pairs: q.pairs || [],
                answer: q.answer,
                hint: q.hint,
                explanation: q.explanation,
                tags: q.tags || [],
                source: 'llm-generated',
                status: 'pending', // Set pending status for content moderation
                submissionStatus: 'pending', // For teacher approval workflow
                creatorType: 'admin', // Questions generated by admin
                bookId: bookId ? new Types.ObjectId(bookId) : undefined,
              });

              const saved = await question.save();
              generatedQuestions.push(saved);
            } catch (saveErr) {
              this.logger.warn(`Failed to save question: ${saveErr.message}`);
            }
          }
        } catch (err) {
          this.logger.error(`Failed to generate ${difficulty} ${qType} questions: ${err.message}`);
        }
      }
    }

    this.logger.log(`Generated and saved ${generatedQuestions.length} questions`);
    return { generated: generatedQuestions.length, questions: generatedQuestions };
  }

  // ==================== QUESTION FETCHING (NON-REPEATING) ====================

  /**
   * Fetch questions for a quiz/exam, excluding already attempted questions
   * THIS IS THE CORE METHOD FOR NON-REPEATING QUESTIONS
   */
  async fetchQuestionsForStudent(dto: FetchQuestionsDto): Promise<QuestionDocument[]> {
    const {
      studentId,
      subjectId,
      gradeId,
      unitNumber,
      subunitNumber,
      difficulty,
      count = 10,
      questionTypes,
      context = 'quiz',
    } = dto;

    // 0. Resolve Subject ID if it's a Book ID
    let resolvedSubjectId = subjectId;
    if (/^[0-9a-fA-F]{24}$/.test(subjectId)) {
      const subjectExists = await this.subjectModel.exists({ _id: new Types.ObjectId(subjectId) });
      if (!subjectExists) {
        const book = await this.bookModel.findById(subjectId);
        if (book && book.subject) {
          resolvedSubjectId = (book.subject as any)._id?.toString() || book.subject.toString();
        }
      }
    }

    // 1. Get all attempted question IDs for this student
    const attemptedIds = await this.getAttemptedQuestionIds(studentId, resolvedSubjectId, unitNumber);
    
    this.logger.log(`Student ${studentId} has attempted ${attemptedIds.length} questions in this subject/unit`);

    // 2. Build query to fetch questions
    const query: any = {
      subjectId: new Types.ObjectId(resolvedSubjectId),
      isActive: true,
      questionId: { $nin: attemptedIds }, // EXCLUDE attempted questions
    };

    if (gradeId && /^[0-9a-fA-F]{24}$/.test(gradeId)) {
      query.gradeId = new Types.ObjectId(gradeId);
    }

    if (unitNumber !== undefined) {
      query.unitNumber = unitNumber;
    }

    if (subunitNumber) {
      query.subunitNumber = subunitNumber;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (questionTypes && questionTypes.length > 0) {
      query.type = { $in: questionTypes };
    }

    // 3. Fetch random questions
    const questions = await this.questionModel.aggregate([
      { $match: query },
      { $sample: { size: count } },
    ]);

    // If not enough questions, log warning
    if (questions.length < count) {
      this.logger.warn(
        `Only ${questions.length} unattempted questions available out of ${count} requested for student ${studentId}`
      );
    }

    return questions;
  }

  /**
   * Fetch questions with mixed difficulties for comprehensive assessment
   */
  async fetchMixedDifficultyQuestions(dto: FetchQuestionsDto): Promise<QuestionDocument[]> {
    const { studentId, subjectId, gradeId, unitNumber, count = 10 } = dto;

    // 0. Resolve Subject ID if it's a Book ID
    let resolvedSubjectId = subjectId;
    if (/^[0-9a-fA-F]{24}$/.test(subjectId)) {
      const subjectExists = await this.subjectModel.exists({ _id: new Types.ObjectId(subjectId) });
      if (!subjectExists) {
        const book = await this.bookModel.findById(subjectId);
        if (book && book.subject) {
          resolvedSubjectId = (book.subject as any)._id?.toString() || book.subject.toString();
        }
      }
    }

    const attemptedIds = await this.getAttemptedQuestionIds(studentId, resolvedSubjectId, unitNumber);

    const baseQuery: any = {
      subjectId: new Types.ObjectId(resolvedSubjectId),
      isActive: true,
      questionId: { $nin: attemptedIds },
    };

    if (gradeId && /^[0-9a-fA-F]{24}$/.test(gradeId)) baseQuery.gradeId = new Types.ObjectId(gradeId);
    if (unitNumber !== undefined) baseQuery.unitNumber = unitNumber;

    // Distribute questions across difficulties
    const easyCount = Math.ceil(count * 0.3);
    const mediumCount = Math.ceil(count * 0.5);
    const hardCount = count - easyCount - mediumCount;

    const [easy, medium, hard] = await Promise.all([
      this.questionModel.aggregate([
        { $match: { ...baseQuery, difficulty: 'easy' } },
        { $sample: { size: easyCount } },
      ]),
      this.questionModel.aggregate([
        { $match: { ...baseQuery, difficulty: 'medium' } },
        { $sample: { size: mediumCount } },
      ]),
      this.questionModel.aggregate([
        { $match: { ...baseQuery, difficulty: 'hard' } },
        { $sample: { size: hardCount } },
      ]),
    ]);

    // Combine and shuffle
    const allQuestions = [...easy, ...medium, ...hard];
    return this.shuffleArray(allQuestions);
  }

  // ==================== ATTEMPT TRACKING ====================

  /**
   * Get all attempted question IDs for a student
   */
  async getAttemptedQuestionIds(
    studentId: string, 
    subjectId: string, 
    unitNumber?: number
  ): Promise<string[]> {
    const query: any = {
      studentId,
      subjectId: new Types.ObjectId(subjectId),
    };

    if (unitNumber !== undefined) {
      query.unitNumber = unitNumber;
      const record = await this.attemptedModel.findOne(query);
      return record?.attemptedQuestionIds || [];
    }

    // For subject-wide exams, we need all attempted questions across all units
    const records = await this.attemptedModel.find(query);
    const allIds = new Set<string>();
    records.forEach(r => {
      r.attemptedQuestionIds.forEach(id => allIds.add(id));
    });
    return Array.from(allIds);
  }

  /**
   * Record attempted questions for a student
   * Called after quiz/exam completion
   */
  async recordAttemptedQuestions(dto: RecordAttemptDto): Promise<void> {
    const { studentId, subjectId, gradeId, unitNumber, questionIds, context = 'quiz', sessionId, results } = dto;

    const query: any = {
      studentId,
      subjectId: new Types.ObjectId(subjectId),
    };

    if (unitNumber !== undefined) {
      query.unitNumber = unitNumber;
    }

    // Create base update data
    const updateData: any = {
      $addToSet: { attemptedQuestionIds: { $each: questionIds } },
    };

    // Add detailed attempt records
    const attemptDetails = questionIds.map(qId => {
      const result = results?.find(r => r.questionId === qId);
      return {
        questionId: qId,
        attemptedAt: new Date(),
        context,
        wasCorrect: result?.wasCorrect,
        attemptNumber: 1,
        sessionId,
      };
    });

    updateData.$push = { attemptDetails: { $each: attemptDetails } };

    // Update usage statistics for each question
    for (const qId of questionIds) {
      const result = results?.find(r => r.questionId === qId);
      const statsUpdate: any = { $inc: { timesUsed: 1 } };
      if (result?.wasCorrect === true) {
        statsUpdate.$inc.correctAttempts = 1;
      } else if (result?.wasCorrect === false) {
        statsUpdate.$inc.incorrectAttempts = 1;
      }
      await this.questionModel.updateOne({ questionId: qId }, statsUpdate);
    }

    await this.attemptedModel.findOneAndUpdate(
      query,
      {
        ...updateData,
        $setOnInsert: {
          studentId,
          subjectId: new Types.ObjectId(subjectId),
          gradeId: gradeId ? new Types.ObjectId(gradeId) : undefined,
          unitNumber,
        },
      },
      { upsert: true, new: true }
    );

    this.logger.log(`Recorded ${questionIds.length} attempted questions for student ${studentId}`);
  }

  // ==================== STATISTICS & INFO ====================

  /**
   * Get question bank statistics
   */
  async getQuestionBankStats(dto: QuestionBankStatsDto): Promise<any> {
    const query: any = { isActive: true };

    if (dto.subjectId) query.subjectId = new Types.ObjectId(dto.subjectId);
    if (dto.gradeId) query.gradeId = new Types.ObjectId(dto.gradeId);
    if (dto.unitNumber !== undefined) query.unitNumber = dto.unitNumber;

    const [total, byDifficulty, byType, byUnit] = await Promise.all([
      this.questionModel.countDocuments(query),
      this.questionModel.aggregate([
        { $match: query },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
      this.questionModel.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.questionModel.aggregate([
        { $match: query },
        { $group: { _id: { unitNumber: '$unitNumber', unitTitle: '$unitTitle' }, count: { $sum: 1 } } },
      ]),
    ]);

    return {
      total,
      byDifficulty: byDifficulty.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byType: byType.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byUnit: byUnit.map(u => ({
        unitNumber: u._id.unitNumber,
        unitTitle: u._id.unitTitle,
        count: u.count,
      })),
    };
  }

  /**
   * Filter questions for admin panel with pagination and counts
   */
  async filterQuestions(dto: {
    gradeId?: string;
    subjectId?: string;
    type?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    questions: QuestionDocument[];
    stats: {
      byType: Record<string, number>;
      byDifficulty: Record<string, number>;
    };
  }> {
    const { gradeId, subjectId, type, difficulty, page = 1, limit = 20 } = dto;

    // Build filter query
    const query: any = { isActive: true };

    if (gradeId && /^[0-9a-fA-F]{24}$/.test(gradeId)) {
      query.gradeId = new Types.ObjectId(gradeId);
    }
    if (subjectId && /^[0-9a-fA-F]{24}$/.test(subjectId)) {
      query.subjectId = new Types.ObjectId(subjectId);
    }
    if (type) {
      query.type = type;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Get total count and stats
    const [total, byType, byDifficulty, questions] = await Promise.all([
      this.questionModel.countDocuments(query),
      this.questionModel.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      this.questionModel.aggregate([
        { $match: query },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
      this.questionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      questions: questions as unknown as QuestionDocument[],
      stats: {
        byType: byType.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        byDifficulty: byDifficulty.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      },
    };
  }

  /**
   * Check how many unattempted questions are available for a student
   */
  async checkAvailableQuestions(dto: CheckAvailableQuestionsDto): Promise<{
    total: number;
    attempted: number;
    available: number;
    byDifficulty: Record<string, number>;
  }> {
    const { studentId, subjectId, gradeId, unitNumber, difficulty, questionTypes } = dto;

    // 0. Resolve Subject ID if it's a Book ID
    let resolvedSubjectId = subjectId;
    if (/^[0-9a-fA-F]{24}$/.test(subjectId)) {
      const subjectExists = await this.subjectModel.exists({ _id: new Types.ObjectId(subjectId) });
      if (!subjectExists) {
        const book = await this.bookModel.findById(subjectId);
        if (book && book.subject) {
          resolvedSubjectId = (book.subject as any)._id?.toString() || book.subject.toString();
        }
      }
    }

    const baseQuery: any = {
      subjectId: new Types.ObjectId(resolvedSubjectId),
      isActive: true,
    };

    if (gradeId && /^[0-9a-fA-F]{24}$/.test(gradeId)) baseQuery.gradeId = new Types.ObjectId(gradeId);
    if (unitNumber !== undefined) baseQuery.unitNumber = unitNumber;
    if (difficulty) baseQuery.difficulty = difficulty;
    if (questionTypes && questionTypes.length > 0) {
      baseQuery.type = { $in: questionTypes };
    }


    const attemptedIds = await this.getAttemptedQuestionIds(studentId, resolvedSubjectId, unitNumber);


    const [total, available, availableByDifficulty] = await Promise.all([
      this.questionModel.countDocuments(baseQuery),
      this.questionModel.countDocuments({ ...baseQuery, questionId: { $nin: attemptedIds } }),
      this.questionModel.aggregate([
        { $match: { ...baseQuery, questionId: { $nin: attemptedIds } } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
    ]);


    return {
      total,
      attempted: attemptedIds.length,
      available,
      byDifficulty: availableByDifficulty.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    };
  }

  /**
   * Get student's attempt history
   */
  async getStudentAttemptHistory(studentId: string, subjectId?: string): Promise<any> {
    const query: any = { studentId };
    if (subjectId && Types.ObjectId.isValid(subjectId)) {
      query.subjectId = new Types.ObjectId(subjectId);
    }

    return this.attemptedModel.find(query).lean();
  }

  /**
   * DEBUG: List all questions with their key IDs (for troubleshooting)
   */
  async debugListAllQuestions(): Promise<any> {
    const questions = await this.questionModel.find({}).select(
      'questionId subjectId gradeId unitNumber unitTitle type difficulty isActive question'
    ).limit(50).lean();

    return {
      count: questions.length,
      questions: questions.map(q => ({
        questionId: q.questionId,
        subjectId: q.subjectId?.toString(),
        gradeId: q.gradeId?.toString(),
        unitNumber: q.unitNumber,
        unitTitle: q.unitTitle,
        type: q.type,
        difficulty: q.difficulty,
        isActive: q.isActive,
        questionPreview: q.question?.substring(0, 50) + '...',
      })),
    };
  }

  // ==================== HELPER METHODS ====================

  private getCollectionName(grade: string, subject: string): string {
    return `${grade}_${subject}`
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .toLowerCase();
  }

  private async fetchContextFromQdrant(
    collectionName: string,
    unitTitle: string,
    subunitTitle?: string
  ): Promise<string[]> {
    try {
      const vector = await this.llmService.embed(subunitTitle || unitTitle);
      const searchResults = await this.qdrant.search(collectionName, {
        vector,
        limit: 10,
      });
      return searchResults.map((r: any) => r.payload?.text).filter(Boolean);
    } catch (err) {
      this.logger.warn(`Qdrant search failed: ${err.message}`);
      return [];
    }
  }

  private buildGenerationPrompt(params: {
    gradeTitle: string;
    subjectTitle: string;
    unitTitle: string;
    subunitTitle?: string;
    difficulty: DifficultyLevel;
    questionType: QuestionType;
    count: number;
    context: string[];
  }): string {
    const { gradeTitle, subjectTitle, unitTitle, subunitTitle, difficulty, questionType, count, context } = params;
    const contextText = context.length > 0 ? context.join('\n\n').slice(0, 10000) : 'Use your knowledge of the subject.';

    const difficultyGuide = {
      easy: 'Simple recall questions, basic facts, straightforward concepts',
      medium: 'Apply concepts, some analysis required, moderate complexity',
      hard: 'Complex analysis, synthesis, critical thinking, multi-step problems',
    };

    const typeGuide = {
      'mcq': 'Multiple choice with 4 options (A, B, C, D)',
      'true-false': 'True/False statements',
      'fill-blank': 'Fill in the blank with ___ marker',
      'short-answer': 'Short answer requiring 1-3 sentences',
      'matching': 'Matching pairs (left-right)',
    };

    return `
You are an expert question generator for ${gradeTitle} ${subjectTitle}.
Generate exactly ${count} ${difficulty.toUpperCase()} difficulty ${questionType} questions.

Topic: ${unitTitle}${subunitTitle ? ` - ${subunitTitle}` : ''}

Difficulty Level (${difficulty}): ${difficultyGuide[difficulty]}
Question Type: ${typeGuide[questionType]}

Reference Material:
${contextText}

Requirements:
1. Generate exactly ${count} questions
2. All questions must be ${difficulty} difficulty
3. All questions must be type "${questionType}"
4. Each question MUST include:
   - "question": The question text
   - "answer": The correct answer
   - "hint": A helpful hint (for first wrong attempt)
   - "explanation": Detailed explanation (for learning)
${questionType === 'mcq' ? '   - "options": Array of 4 options ["A) ...", "B) ...", "C) ...", "D) ..."]' : ''}
${questionType === 'matching' ? '   - "pairs": Array of {left, right} objects' : ''}

Return ONLY a valid JSON array. Example:
${this.getExampleForType(questionType)}
`;
  }

  private getExampleForType(type: QuestionType): string {
    const examples: Record<QuestionType, string> = {
      'mcq': `[
  {
    "question": "What is the capital of France?",
    "options": ["A) London", "B) Paris", "C) Berlin", "D) Madrid"],
    "answer": "B",
    "hint": "It's known as the City of Light",
    "explanation": "Paris is the capital and largest city of France."
  }
]`,
      'true-false': `[
  {
    "question": "The Earth revolves around the Sun.",
    "answer": "true",
    "hint": "Think about our solar system structure",
    "explanation": "The Earth orbits the Sun once every 365.25 days."
  }
]`,
      'fill-blank': `[
  {
    "question": "The ___ is the basic unit of life.",
    "answer": "cell",
    "hint": "It's the smallest structural unit",
    "explanation": "The cell is the basic structural and functional unit of all organisms."
  }
]`,
      'short-answer': `[
  {
    "question": "Explain the process of photosynthesis.",
    "answer": "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
    "hint": "Think about how plants make their food",
    "explanation": "In photosynthesis, chlorophyll absorbs light energy to convert CO2 and H2O into glucose and O2."
  }
]`,
      'matching': `[
  {
    "question": "Match the organelles with their functions",
    "pairs": [
      {"left": "Mitochondria", "right": "Energy production"},
      {"left": "Nucleus", "right": "Genetic material storage"},
      {"left": "Ribosome", "right": "Protein synthesis"}
    ],
    "answer": "match-all",
    "hint": "Think about what each organelle does in the cell",
    "explanation": "Each organelle has a specific function that contributes to cell survival."
  }
]`,
    };
    return examples[type];
  }

  private parseLLMResponse(text: string): any[] {
    try {
      let cleanedText = text.trim();
      cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '');

      const arrayStart = cleanedText.indexOf('[');
      const arrayEnd = cleanedText.lastIndexOf(']');

      if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error('No JSON array found in response');
      }

      const jsonStr = cleanedText.substring(arrayStart, arrayEnd + 1);
      return JSON.parse(jsonStr);
    } catch (err) {
      this.logger.error(`Failed to parse LLM response: ${err.message}`);
      return [];
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
