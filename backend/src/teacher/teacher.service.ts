import { Injectable, Logger, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Question, QuestionDocument } from '../question-bank/schemas/question.schema';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import { Book } from '../books/book.schema';
import { TeacherUser, TeacherUserDocument } from './teacher-user.schema';
import { TeacherExamBank, TeacherExamBankDocument } from './schemas/teacher-exam-bank.schema';
import { TeacherExam, TeacherExamDocument } from './schemas/teacher-exam.schema';
import { Summary, SummaryDocument } from '../summary/schemas/summary.schema';
import { ModelExam, ModelExamDocument } from '../national-exam/schemas/model-exam.schema';
import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../rag/services/retrieval.service';
import {
  CreateTeacherQuestionDto,
  UpdateTeacherQuestionDto,
  DuplicateQuestionDto,
  ListTeacherQuestionsDto,
  GenerateFullQuestionDto,
} from './dto/teacher.dto';

@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  // Cache for teacher profile+grade+subject lookups (rarely changes)
  private teacherContextCache = new Map<string, { data: any; expiry: number }>();
  private readonly TEACHER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(Grade.name) private gradeModel: Model<Grade>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    @InjectModel(TeacherUser.name) private teacherUserModel: Model<TeacherUserDocument>,
    @InjectModel(TeacherExamBank.name) private teacherExamBankModel: Model<TeacherExamBankDocument>,
    @InjectModel(TeacherExam.name) private teacherExamModel: Model<TeacherExamDocument>,
    @InjectModel(Summary.name) private summaryModel: Model<SummaryDocument>,
    @InjectModel(ModelExam.name) private modelExamModel: Model<ModelExamDocument>,
    private readonly llmService: LlmService,
    private readonly retrievalService: RetrievalService,
  ) {}

  /**
   * Cached helper: fetch teacher profile + grade + subject in one shot.
   * Avoids 3 sequential DB calls on every approval request.
   */
  private async getTeacherContext(teacherId: string): Promise<{
    teacher: any;
    gradeTitle: string;
    subjectTitle: string;
  } | null> {
    const now = Date.now();
    const cached = this.teacherContextCache.get(teacherId);
    if (cached && cached.expiry > now) {
      return cached.data;
    }

    const teacher = await this.teacherUserModel.findById(teacherId).lean();
    if (!teacher || !teacher.gradeId || !teacher.subjectId) {
      return null;
    }

    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(teacher.gradeId).lean(),
      this.subjectModel.findById(teacher.subjectId).lean(),
    ]);

    const data = {
      teacher,
      gradeTitle: grade?.title || 'Unknown Grade',
      subjectTitle: subject?.title || 'Unknown Subject',
    };

    this.teacherContextCache.set(teacherId, { data, expiry: now + this.TEACHER_CACHE_TTL });
    return data;
  }

  /**
   * Create a new question as a teacher (saved as draft by default)
   */
  async createQuestion(teacherId: string, dto: CreateTeacherQuestionDto): Promise<QuestionDocument> {
    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(dto.gradeId),
      this.subjectModel.findById(dto.subjectId),
    ]);

    if (!grade) throw new NotFoundException(`Grade not found: ${dto.gradeId}`);
    if (!subject) throw new NotFoundException(`Subject not found: ${dto.subjectId}`);

    const question = new this.questionModel({
      questionId: `Q_${uuidv4()}`,
      gradeId: new Types.ObjectId(dto.gradeId),
      subjectId: new Types.ObjectId(dto.subjectId),
      gradeTitle: grade.title,
      subjectTitle: subject.title,
      unitNumber: dto.unitNumber,
      unitTitle: dto.unitTitle,
      subunitNumber: dto.subunitNumber,
      subunitTitle: dto.subunitTitle,
      type: dto.type,
      difficulty: dto.difficulty,
      question: dto.question,
      options: dto.options || [],
      pairs: dto.pairs || [],
      answer: dto.answer,
      hint: dto.hint,
      explanation: dto.explanation,
      tags: dto.tags || [],
      source: 'teacher',
      createdBy: new Types.ObjectId(teacherId),
      creatorType: 'teacher',
      submissionStatus: dto.saveAsDraft !== false ? 'draft' : 'pending',
      status: 'pending',
      isActive: false, // Not active until approved
      revisionHistory: [{
        date: new Date(),
        changes: 'Question created',
        changedBy: teacherId,
      }],
    });

    const saved = await question.save();
    this.logger.log(`Teacher ${teacherId} created question ${saved.questionId}`);
    return saved;
  }

  /**
   * List teacher's own questions
   */
  async listQuestions(teacherId: string, dto: ListTeacherQuestionsDto): Promise<{
    questions: QuestionDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status, page = 1, limit = 20 } = dto;

    const query: any = {
      createdBy: new Types.ObjectId(teacherId),
      creatorType: 'teacher',
    };

    if (status) {
      query.submissionStatus = status;
    }

    const [questions, total] = await Promise.all([
      this.questionModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.questionModel.countDocuments(query),
    ]);

    return {
      questions: questions as unknown as QuestionDocument[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single question by ID (must be owned by teacher)
   */
  async getQuestion(teacherId: string, questionId: string): Promise<QuestionDocument> {
    const question = await this.questionModel.findOne({ questionId }).lean();

    if (!question) {
      throw new NotFoundException(`Question not found: ${questionId}`);
    }

    if (question.createdBy?.toString() !== teacherId) {
      throw new ForbiddenException('You can only view your own questions');
    }

    return question as unknown as QuestionDocument;
  }

  /**
   * Update a teacher's question (only if draft or rejected)
   */
  async updateQuestion(
    teacherId: string,
    questionId: string,
    dto: UpdateTeacherQuestionDto,
  ): Promise<QuestionDocument> {
    const question = await this.questionModel.findOne({ questionId });

    if (!question) {
      throw new NotFoundException(`Question not found: ${questionId}`);
    }

    if (question.createdBy?.toString() !== teacherId) {
      throw new ForbiddenException('You can only edit your own questions');
    }

    if (!['draft', 'rejected'].includes(question.submissionStatus)) {
      throw new ForbiddenException('Can only edit draft or rejected questions');
    }

    // Apply updates
    Object.assign(question, dto);
    question.revisionHistory.push({
      date: new Date(),
      changes: `Updated: ${Object.keys(dto).join(', ')}`,
      changedBy: teacherId,
    });

    return question.save();
  }

  /**
   * Delete a draft question
   */
  async deleteQuestion(teacherId: string, questionId: string): Promise<void> {
    const question = await this.questionModel.findOne({ questionId });

    if (!question) {
      throw new NotFoundException(`Question not found: ${questionId}`);
    }

    if (question.createdBy?.toString() !== teacherId) {
      throw new ForbiddenException('You can only delete your own questions');
    }

    if (question.submissionStatus !== 'draft') {
      throw new ForbiddenException('Can only delete draft questions');
    }

    await this.questionModel.deleteOne({ questionId });
    this.logger.log(`Teacher ${teacherId} deleted question ${questionId}`);
  }

  /**
   * Submit a question for admin approval
   */
  async submitForApproval(teacherId: string, questionId: string): Promise<QuestionDocument> {
    const question = await this.questionModel.findOne({ questionId });

    if (!question) {
      throw new NotFoundException(`Question not found: ${questionId}`);
    }

    if (question.createdBy?.toString() !== teacherId) {
      throw new ForbiddenException('You can only submit your own questions');
    }

    if (!['draft', 'rejected'].includes(question.submissionStatus)) {
      throw new ForbiddenException('Question already submitted or approved');
    }

    question.submissionStatus = 'pending';
    question.adminComments = undefined; // Clear previous comments
    question.revisionHistory.push({
      date: new Date(),
      changes: 'Submitted for approval',
      changedBy: teacherId,
    });

    return question.save();
  }

  /**
   * Duplicate a question to another grade/subject
   */
  async duplicateQuestion(
    teacherId: string,
    questionId: string,
    dto: DuplicateQuestionDto,
  ): Promise<QuestionDocument> {
    const original = await this.questionModel.findOne({ questionId }).lean();

    if (!original) {
      throw new NotFoundException(`Question not found: ${questionId}`);
    }

    if (original.createdBy?.toString() !== teacherId) {
      throw new ForbiddenException('You can only duplicate your own questions');
    }

    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(dto.targetGradeId),
      this.subjectModel.findById(dto.targetSubjectId),
    ]);

    if (!grade) throw new NotFoundException(`Target grade not found`);
    if (!subject) throw new NotFoundException(`Target subject not found`);

    const duplicate = new this.questionModel({
      ...original,
      _id: undefined,
      questionId: `Q_${uuidv4()}`,
      gradeId: new Types.ObjectId(dto.targetGradeId),
      subjectId: new Types.ObjectId(dto.targetSubjectId),
      gradeTitle: grade.title,
      subjectTitle: subject.title,
      unitNumber: dto.targetUnitNumber || original.unitNumber,
      submissionStatus: 'draft',
      status: 'pending',
      isActive: false,
      createdAt: undefined,
      updatedAt: undefined,
      revisionHistory: [{
        date: new Date(),
        changes: `Duplicated from ${questionId}`,
        changedBy: teacherId,
      }],
    });

    return duplicate.save();
  }

  // ==================== AI TOOLS ====================

  /**
   * AI: Improve question clarity and quality
   */
  async improveQuestion(teacherId: string, questionId: string): Promise<{
    original: string;
    improved: string;
    suggestions: string[];
  }> {
    const question = await this.getQuestion(teacherId, questionId);

    const prompt = `
You are an expert educational content reviewer. Analyze and improve this question.

Original Question: "${question.question}"
Type: ${question.type}
Difficulty: ${question.difficulty}
Grade Level: ${question.gradeTitle}
Subject: ${question.subjectTitle}

Please provide:
1. An improved version of the question that is clearer and more pedagogically effective
2. 2-3 specific suggestions for improvement

Return JSON:
{
  "improved": "the improved question text",
  "suggestions": ["suggestion 1", "suggestion 2"]
}
`;

    const response = await this.llmService.generate(prompt, { temperature: 0.7 });
    
    try {
      const parsed = JSON.parse(response.text.replace(/```json\n?|\n?```/g, ''));
      return {
        original: question.question,
        improved: parsed.improved,
        suggestions: parsed.suggestions,
      };
    } catch {
      return {
        original: question.question,
        improved: response.text,
        suggestions: [],
      };
    }
  }

  /**
   * AI: Generate question variations
   */
  async generateVariations(teacherId: string, questionId: string, count: number = 3): Promise<any[]> {
    const question = await this.getQuestion(teacherId, questionId);

    const prompt = `
Generate ${count} variations of this question keeping similar difficulty and format.

Original Question: "${question.question}"
Type: ${question.type}
Answer: ${question.answer}
Difficulty: ${question.difficulty}

Each variation should test the same concept but with different wording or values.
Return JSON array of variations, each with: question, answer, hint, explanation.
`;

    const response = await this.llmService.generate(prompt, { temperature: 0.8 });
    
    try {
      const text = response.text.replace(/```json\n?|\n?```/g, '');
      return JSON.parse(text);
    } catch {
      return [];
    }
  }

  /**
   * AI: Predict question difficulty
   */
  async predictDifficulty(questionText: string, gradeId?: string): Promise<{
    predicted: string;
    confidence: number;
    reasoning: string;
  }> {
    let gradeContext = '';
    if (gradeId) {
      const grade = await this.gradeModel.findById(gradeId);
      gradeContext = grade ? `for ${grade.title} students` : '';
    }

    const prompt = `
Analyze this question and predict its difficulty level ${gradeContext}.

Question: "${questionText}"

Evaluate based on:
- Cognitive load required
- Prior knowledge needed
- Problem complexity
- Time likely needed to answer

Return JSON:
{
  "predicted": "easy|medium|hard",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}
`;

    const response = await this.llmService.generate(prompt, { temperature: 0.3 });
    
    try {
      const parsed = JSON.parse(response.text.replace(/```json\n?|\n?```/g, ''));
      return parsed;
    } catch {
      return { predicted: 'medium', confidence: 0.5, reasoning: 'Unable to analyze' };
    }
  }

  /**
   * AI: Generate answer and explanation
   */
  async generateAnswer(questionText: string, type: string, options?: string[]): Promise<{
    answer: string;
    explanation: string;
    hint: string;
  }> {
    const optionsText = options?.length ? `Options: ${options.join(', ')}` : '';

    const prompt = `
Provide the correct answer for this ${type} question.

Question: "${questionText}"
${optionsText}

Return JSON:
{
  "answer": "the correct answer",
  "explanation": "detailed explanation of why this is correct",
  "hint": "a helpful hint without giving away the answer"
}
`;

    const response = await this.llmService.generate(prompt, { temperature: 0.3 });
    
    try {
      return JSON.parse(response.text.replace(/```json\n?|\n?```/g, ''));
    } catch {
      return { answer: '', explanation: '', hint: '' };
    }
  }

  /**
   * AI: Check curriculum alignment
   */
  async checkAlignment(
    questionText: string,
    gradeId: string,
    subjectId: string,
    unitNumber: number,
  ): Promise<{
    aligned: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(gradeId),
      this.subjectModel.findById(subjectId),
    ]);

    const prompt = `
Check if this question is appropriate for:
- Grade: ${grade?.title || 'Unknown'}
- Subject: ${subject?.title || 'Unknown'}
- Unit: ${unitNumber}

Question: "${questionText}"

Evaluate:
1. Is the content age-appropriate?
2. Does it match expected curriculum scope?
3. Is the vocabulary suitable for this grade?
4. Does it test relevant learning objectives?

Return JSON:
{
  "aligned": true/false,
  "score": 0-100,
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1"]
}
`;

    const response = await this.llmService.generate(prompt, { temperature: 0.3 });
    
    try {
      return JSON.parse(response.text.replace(/```json\n?|\n?```/g, ''));
    } catch {
      return { aligned: true, score: 75, issues: [], suggestions: [] };
    }
  }

  /**
   * AI: Generate a complete question using curriculum context
   * Uses the same pattern as QuizService for proper RAG retrieval
   */
  async generateFullQuestion(dto: GenerateFullQuestionDto): Promise<{
    question: string;
    options?: string[];
    answer: string;
    hint: string;
    explanation: string;
  }> {
    const { gradeId, subjectId, unitNumber, unitTitle, subunitNumber, subunitTitle, type, difficulty } = dto;

    this.logger.log(`[AI Generate] Starting question generation - Type: ${type}, Difficulty: ${difficulty}`);

    // Resolve Grade and Subject
    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(gradeId),
      this.subjectModel.findById(subjectId),
    ]);

    if (!grade) throw new NotFoundException(`Grade not found: ${gradeId}`);
    if (!subject) throw new NotFoundException(`Subject not found: ${subjectId}`);

    this.logger.log(`[AI Generate] Grade: ${grade.title}, Subject: ${subject.title}, Unit: ${unitTitle}`);

    // Build collection name the same way as QuizService
    const collectionName = this.getCollectionName(grade.title, subject.title);
    
    // Fetch context using RetrievalService (same pattern as QuizService)
    let chunks: string[] = [];
    try {
      const unitNum = Number(unitNumber);
      let retrievalResult;
      
      if (subunitNumber) {
        // Subunit-level retrieval
        this.logger.log(`[AI Generate] Fetching context for subunit: ${subunitNumber}`);
        retrievalResult = await this.retrievalService.retrieveForSubunit(
          collectionName,
          unitNum,
          subunitNumber,
        );
      } else {
        // Unit-level retrieval
        this.logger.log(`[AI Generate] Fetching context for unit: ${unitNum}`);
        retrievalResult = await this.retrievalService.retrieveForUnit(
          collectionName,
          unitNum,
        );
      }
      
      chunks = retrievalResult.chunks.map(c => c.text);
      this.logger.log(`[AI Generate] Retrieved ${chunks.length} chunks from Qdrant`);
    } catch (err) {
      this.logger.warn(`[AI Generate] Context retrieval failed: ${err.message}`);
      // Continue without context - LLM will use general knowledge
    }

    const contextText = chunks.length > 0 
      ? chunks.slice(0, 10).join('\n\n').slice(0, 8000) 
      : 'Use your general knowledge of the subject to generate the question.';

    const difficultyGuide = {
      easy: 'Simple recall questions, basic facts, straightforward concepts',
      medium: 'Apply concepts, some analysis required, moderate complexity',
      hard: 'Complex analysis, synthesis, critical thinking, multi-step problems',
    };

    const typeInstructions = {
      'mcq': 'Generate a multiple choice question with exactly 4 options (A, B, C, D). The answer should be just the letter (A, B, C, or D).',
      'true-false': 'Generate a true/false statement. The answer should be "true" or "false" (lowercase).',
      'fill-blank': 'Generate a fill-in-the-blank question using ___ to mark the blank. The answer is the word/phrase that fills the blank.',
      'short-answer': 'Generate a question requiring a 1-3 sentence answer.',
    };

    const topicText = unitTitle + (subunitTitle ? ` - ${subunitTitle}` : '');

    const prompt = `
You are an expert question generator for ${grade.title} ${subject.title}.
Generate exactly 1 ${difficulty.toUpperCase()} difficulty ${type} question.

Topic: ${topicText}

Difficulty Level: ${difficultyGuide[difficulty]}

Question Type Instructions:
${typeInstructions[type]}

Reference Material:
${contextText}

Rules:
1. Question MUST match ${difficulty} difficulty level
2. Question MUST be of type "${type}"
3. Include a helpful hint (shown on first wrong attempt)
4. Include detailed explanation (shown on second wrong attempt)
5. Base your question on the reference material when available
${type === 'mcq' ? '6. Format options as: ["A) option", "B) option", "C) option", "D) option"]' : ''}

Return ONLY valid JSON (no markdown, no extra text):
{
  "question": "the question text here",
  ${type === 'mcq' ? '"options": ["A) first option", "B) second option", "C) third option", "D) fourth option"],' : ''}
  "answer": "correct answer",
  "hint": "helpful hint here",
  "explanation": "detailed explanation here"
}
`;

    this.logger.log(`[AI Generate] Calling LLM with prompt length: ${prompt.length}`);
    
    try {
      const response = await this.llmService.generate(prompt, { temperature: 0.7 });

      if (!response?.text?.trim()) {
        this.logger.error('[AI Generate] LLM returned empty response');
        throw new InternalServerErrorException('LLM returned empty response');
      }

      this.logger.log(`[AI Generate] LLM response length: ${response.text.length}`);

      // Parse the JSON response
      let text = response.text.trim();
      text = text.replace(/```json\n?|\n?```/g, '');
      
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        this.logger.error(`[AI Generate] No JSON found in response: ${text.substring(0, 200)}`);
        throw new InternalServerErrorException('LLM did not return valid JSON');
      }

      const jsonStr = text.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonStr);

      if (!parsed.question?.trim()) {
        throw new InternalServerErrorException('Generated question is empty');
      }

      this.logger.log(`[AI Generate] Successfully generated: "${parsed.question.substring(0, 50)}..."`);

      return {
        question: parsed.question,
        options: type === 'mcq' ? (parsed.options || ['A) ', 'B) ', 'C) ', 'D) ']) : undefined,
        answer: parsed.answer || '',
        hint: parsed.hint || 'Think carefully about this.',
        explanation: parsed.explanation || 'Review the material for this topic.',
      };
    } catch (err) {
      this.logger.error(`[AI Generate] Error: ${err.message}`);
      throw new InternalServerErrorException(`Question generation failed: ${err.message}`);
    }
  }

  /**
   * AI: Generate multiple questions in a SINGLE LLM call (saves API quota)
   * Instead of N separate calls, this batches all questions into one prompt.
   */
  async generateBatchQuestions(dto: any): Promise<Array<{
    question: string;
    options?: string[];
    answer: string;
    hint: string;
    explanation: string;
    type: string;
    difficulty: string;
  }>> {
    const { gradeId, subjectId, unitNumber, unitTitle, subunitNumber, subunitTitle, questions: questionSpecs } = dto;

    this.logger.log(`[AI Batch] Starting batch generation of ${questionSpecs.length} questions`);

    // Resolve Grade and Subject
    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(gradeId),
      this.subjectModel.findById(subjectId),
    ]);

    if (!grade) throw new NotFoundException(`Grade not found: ${gradeId}`);
    if (!subject) throw new NotFoundException(`Subject not found: ${subjectId}`);

    // Fetch context once (shared across all questions)
    const collectionName = this.getCollectionName(grade.title, subject.title);
    let chunks: string[] = [];
    try {
      const unitNum = Number(unitNumber);
      let retrievalResult;
      if (subunitNumber) {
        retrievalResult = await this.retrievalService.retrieveForSubunit(collectionName, unitNum, subunitNumber);
      } else {
        retrievalResult = await this.retrievalService.retrieveForUnit(collectionName, unitNum);
      }
      chunks = retrievalResult.chunks.map(c => c.text);
      this.logger.log(`[AI Batch] Retrieved ${chunks.length} chunks from Qdrant`);
    } catch (err) {
      this.logger.warn(`[AI Batch] Context retrieval failed: ${err.message}`);
    }

    const contextText = chunks.length > 0
      ? chunks.slice(0, 10).join('\n\n').slice(0, 6000)
      : 'Use your general knowledge of the subject.';

    const topicText = unitTitle + (subunitTitle ? ` - ${subunitTitle}` : '');

    const difficultyGuide = {
      easy: 'Simple recall, basic facts',
      medium: 'Apply concepts, moderate complexity',
      hard: 'Complex analysis, critical thinking',
    };

    // Build question specs for the prompt
    const questionDescriptions = questionSpecs.map((q, i) => {
      const typeInstruction = {
        'mcq': '4-option MCQ (answer = letter A/B/C/D, include "options" array)',
        'true-false': 'True/False statement (answer = "true" or "false")',
        'fill-blank': 'Fill-in-the-blank with ___ (answer = the word/phrase)',
        'short-answer': 'Short answer question (answer = 1-3 sentences)',
      };
      return `  ${i + 1}. Type: ${q.type} (${typeInstruction[q.type] || q.type}), Difficulty: ${q.difficulty} (${difficultyGuide[q.difficulty] || q.difficulty})`;
    }).join('\n');

    const prompt = `You are an expert question generator for ${grade.title} ${subject.title}.
Topic: ${topicText}

Generate exactly ${questionSpecs.length} questions with these specifications:
${questionDescriptions}

Reference Material:
${contextText}

CRITICAL RULES — TOPIC DIVERSITY:
1. First, identify ALL distinct sub-topics/concepts in the reference material (e.g., for "Solutions": molarity, dilution, Henry's Law, colligative properties, vapor pressure, boiling point elevation, etc.)
2. You MUST select a DIFFERENT sub-topic for each question. NEVER repeat the same concept.
3. Spread questions across as many different sub-topics as possible to maximize coverage.
4. If there are ${questionSpecs.length} questions, there must be ${questionSpecs.length} different concepts tested.

OTHER RULES:
5. Each question MUST match its specified difficulty and type
6. Each question needs: question, answer, hint, explanation
7. MCQ questions need an "options" array: ["A) ...", "B) ...", "C) ...", "D) ..."]
8. Base questions on the reference material when available

Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "question": "...",
    "type": "${questionSpecs[0]?.type || 'mcq'}",
    "difficulty": "${questionSpecs[0]?.difficulty || 'medium'}",
    ${questionSpecs.some(q => q.type === 'mcq') ? '"options": ["A) ...", "B) ...", "C) ...", "D) ..."],' : ''}
    "answer": "...",
    "hint": "...",
    "explanation": "..."
  }
]`;

    this.logger.log(`[AI Batch] Calling LLM with prompt length: ${prompt.length}`);

    try {
      const response = await this.llmService.generate(prompt, { temperature: 0.7 });

      if (!response?.text?.trim()) {
        throw new InternalServerErrorException('LLM returned empty response');
      }

      // Parse the JSON array response
      let text = response.text.trim();
      text = text.replace(/```json\n?|\n?```/g, '');

      const arrayStart = text.indexOf('[');
      const arrayEnd = text.lastIndexOf(']');

      if (arrayStart === -1 || arrayEnd === -1) {
        this.logger.error(`[AI Batch] No JSON array found in response: ${text.substring(0, 200)}`);
        throw new InternalServerErrorException('LLM did not return valid JSON array');
      }

      const jsonStr = text.substring(arrayStart, arrayEnd + 1);
      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        throw new InternalServerErrorException('LLM response is not an array');
      }

      this.logger.log(`[AI Batch] Successfully generated ${parsed.length} questions in 1 API call`);

      // Map results back with the requested type/difficulty
      return parsed.map((item, i) => ({
        question: item.question || '',
        options: item.options || (questionSpecs[i]?.type === 'mcq' ? ['A) ', 'B) ', 'C) ', 'D) '] : undefined),
        answer: item.answer || '',
        hint: item.hint || 'Think carefully about this.',
        explanation: item.explanation || 'Review the material for this topic.',
        type: questionSpecs[i]?.type || item.type || 'mcq',
        difficulty: questionSpecs[i]?.difficulty || item.difficulty || 'medium',
      }));
    } catch (err) {
      this.logger.error(`[AI Batch] Error: ${err.message}`);
      throw new InternalServerErrorException(`Batch question generation failed: ${err.message}`);
    }
  }

  /**
   * Get teacher dashboard stats
   */
  async getDashboardStats(teacherId: string): Promise<{
    total: number;
    drafts: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const query = {
      createdBy: new Types.ObjectId(teacherId),
      creatorType: 'teacher',
    };

    const [total, byStatus] = await Promise.all([
      this.questionModel.countDocuments(query),
      this.questionModel.aggregate([
        { $match: query },
        { $group: { _id: '$submissionStatus', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = byStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});

    return {
      total,
      drafts: statusMap['draft'] || 0,
      pending: statusMap['pending'] || 0,
      approved: statusMap['approved'] || 0,
      rejected: statusMap['rejected'] || 0,
    };
  }

  // ==================== CONTENT APPROVAL (Teacher reviews Admin content) ====================

  /**
   * List questions pending teacher's approval
   * Teachers can only see questions matching their assigned grade and subject
   */
  async listPendingApprovals(
    teacherId: string,
    page: number = 1,
    limit: number = 20,
    contentType?: string, // 'question' | 'summary' | 'model_exam' | 'all'
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    totalPages: number;
    teacherInfo: {
      gradeTitle: string;
      subjectTitle: string;
    };
    counts: {
      questions: number;
      summaries: number;
      modelExams: number;
    };
  }> {
    // Use cached teacher context (avoids 3 DB calls per request)
    const ctx = await this.getTeacherContext(teacherId);
    
    if (!ctx) {
      return { 
        items: [], 
        total: 0, 
        page, 
        totalPages: 0,
        teacherInfo: { gradeTitle: 'Not assigned', subjectTitle: 'Not assigned' },
        counts: { questions: 0, summaries: 0, modelExams: 0 }
      };
    }

    const { teacher, gradeTitle, subjectTitle } = ctx;

    // Build queries for each content type
    const questionQuery = {
      gradeId: teacher.gradeId,
      subjectId: teacher.subjectId,
      creatorType: 'admin',
      submissionStatus: 'pending',
    };

    const summaryQuery = {
      grade: gradeTitle,
      subject: subjectTitle,
      teacherApprovalStatus: 'pending_teacher',
    };

    const modelExamQuery = {
      subjectId: teacher.subjectId,
      teacherApprovalStatus: 'pending_teacher',
    };

    // Get counts for all types
    const [questionsCount, summariesCount, modelExamsCount] = await Promise.all([
      this.questionModel.countDocuments(questionQuery),
      this.summaryModel.countDocuments(summaryQuery),
      this.modelExamModel.countDocuments(modelExamQuery),
    ]);

    const counts = {
      questions: questionsCount,
      summaries: summariesCount,
      modelExams: modelExamsCount,
    };

    // Determine which content types to fetch
    const filterType = contentType || 'all';
    let items: any[] = [];
    let total = 0;

    if (filterType === 'question' || filterType === 'all') {
      const questions = await this.questionModel
        .find(questionQuery)
        .sort({ createdAt: -1 })
        .skip(filterType === 'question' ? (page - 1) * limit : 0)
        .limit(filterType === 'question' ? limit : 100)
        .lean();
      
      items.push(...questions.map(q => ({
        ...q,
        contentType: 'question',
        title: q.question?.substring(0, 100) + (q.question?.length > 100 ? '...' : ''),
        preview: q.question,
      })));
      
      if (filterType === 'question') {
        total = questionsCount;
      }
    }

    if (filterType === 'summary' || filterType === 'all') {
      const summaries = await this.summaryModel
        .find(summaryQuery)
        .sort({ createdAt: -1 })
        .skip(filterType === 'summary' ? (page - 1) * limit : 0)
        .limit(filterType === 'summary' ? limit : 100)
        .lean();
      
      items.push(...summaries.map(s => ({
        ...s,
        contentType: 'summary',
        title: `${s.unit}${s.subunit ? ' - ' + s.subunit : ''} Summary`,
        preview: s.generalSummary?.substring(0, 200) + '...',
      })));
      
      if (filterType === 'summary') {
        total = summariesCount;
      }
    }

    if (filterType === 'model_exam' || filterType === 'all') {
      const modelExams = await this.modelExamModel
        .find(modelExamQuery)
        .sort({ createdAt: -1 })
        .skip(filterType === 'model_exam' ? (page - 1) * limit : 0)
        .limit(filterType === 'model_exam' ? limit : 100)
        .lean();
      
      items.push(...modelExams.map(e => ({
        ...e,
        contentType: 'model_exam',
        title: e.title,
        preview: `${e.totalQuestions} questions, ${e.duration} minutes`,
      })));
      
      if (filterType === 'model_exam') {
        total = modelExamsCount;
      }
    }

    // If fetching all, sort by date and paginate
    if (filterType === 'all') {
      total = questionsCount + summariesCount + modelExamsCount;
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      items = items.slice((page - 1) * limit, page * limit);
    }

    this.logger.log(`Teacher ${teacherId} (${gradeTitle}/${subjectTitle}) has ${total} pending approvals`);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      teacherInfo: { gradeTitle, subjectTitle },
      counts,
    };
  }

  /**
   * Approve a question (makes it available to students)
   */
  async approveQuestion(teacherId: string, questionId: string): Promise<QuestionDocument> {
    const teacher = await this.teacherUserModel.findById(teacherId).lean();
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const question = await this.questionModel.findOne({ questionId });
    if (!question) {
      throw new NotFoundException(`Question not found: ${questionId}`);
    }

    // Verify teacher can approve this question (matches grade/subject)
    if (
      teacher.gradeId?.toString() !== question.gradeId?.toString() ||
      teacher.subjectId?.toString() !== question.subjectId?.toString()
    ) {
      throw new ForbiddenException('You can only approve questions for your assigned grade and subject');
    }

    if (question.submissionStatus !== 'pending') {
      throw new ForbiddenException('Question is not pending approval');
    }

    // Approve the question
    question.submissionStatus = 'approved';
    question.status = 'approved';
    question.isActive = true;
    question.reviewedBy = teacherId;
    question.reviewedAt = new Date();
    question.revisionHistory.push({
      date: new Date(),
      changes: 'Approved by teacher',
      changedBy: teacherId,
    });

    const saved = await question.save();
    this.logger.log(`Teacher ${teacherId} approved question ${questionId}`);
    
    return saved;
  }

  /**
   * Reject a question (sends back to admin with feedback)
   */
  async rejectQuestion(
    teacherId: string,
    questionId: string,
    reason: string,
  ): Promise<QuestionDocument> {
    const teacher = await this.teacherUserModel.findById(teacherId).lean();
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const question = await this.questionModel.findOne({ questionId });
    if (!question) {
      throw new NotFoundException(`Question not found: ${questionId}`);
    }

    // Verify teacher can reject this question (matches grade/subject)
    if (
      teacher.gradeId?.toString() !== question.gradeId?.toString() ||
      teacher.subjectId?.toString() !== question.subjectId?.toString()
    ) {
      throw new ForbiddenException('You can only reject questions for your assigned grade and subject');
    }

    if (question.submissionStatus !== 'pending') {
      throw new ForbiddenException('Question is not pending approval');
    }

    // Reject the question
    question.submissionStatus = 'rejected';
    question.status = 'pending'; // Keep status as pending until re-approved
    question.isActive = false;
    question.reviewerComment = reason;
    question.reviewedBy = teacherId;
    question.reviewedAt = new Date();
    question.revisionHistory.push({
      date: new Date(),
      changes: `Rejected by teacher: ${reason}`,
      changedBy: teacherId,
    });

    const saved = await question.save();
    this.logger.log(`Teacher ${teacherId} rejected question ${questionId}: ${reason}`);
    return saved;
  }

  /**
   * Approve any content type (question, summary, model_exam)
   */
  async approveContent(
    teacherId: string,
    contentId: string,
    contentType: 'question' | 'summary' | 'model_exam',
  ): Promise<any> {
    const teacher = await this.teacherUserModel.findById(teacherId).lean();
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    switch (contentType) {
      case 'question':
        return this.approveQuestion(teacherId, contentId);
      
      case 'summary':
        const summary = await this.summaryModel.findById(contentId);
        if (!summary) {
          throw new NotFoundException(`Summary not found: ${contentId}`);
        }
        if (summary.teacherApprovalStatus !== 'pending_teacher') {
          throw new ForbiddenException('Summary is not pending teacher approval');
        }
        summary.teacherApprovalStatus = 'approved';
        summary.approvedByTeacherId = teacherId;
        summary.teacherApprovalDate = new Date();
        const savedSummary = await summary.save();
        this.logger.log(`Teacher ${teacherId} approved summary ${contentId}`);
        return savedSummary;
      
      case 'model_exam':
        const modelExam = await this.modelExamModel.findById(contentId);
        if (!modelExam) {
          throw new NotFoundException(`Model exam not found: ${contentId}`);
        }
        if (modelExam.teacherApprovalStatus !== 'pending_teacher') {
          throw new ForbiddenException('Model exam is not pending teacher approval');
        }
        modelExam.teacherApprovalStatus = 'approved';
        modelExam.approvedByTeacherId = teacherId;
        modelExam.teacherApprovalDate = new Date();
        const savedExam = await modelExam.save();
        this.logger.log(`Teacher ${teacherId} approved model exam ${contentId}`);
        return savedExam;
      
      default:
        throw new ForbiddenException(`Unknown content type: ${contentType}`);
    }
  }

  /**
   * Reject any content type (question, summary, model_exam)
   */
  async rejectContent(
    teacherId: string,
    contentId: string,
    contentType: 'question' | 'summary' | 'model_exam',
    reason: string,
  ): Promise<any> {
    const teacher = await this.teacherUserModel.findById(teacherId).lean();
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    switch (contentType) {
      case 'question':
        return this.rejectQuestion(teacherId, contentId, reason);
      
      case 'summary':
        const summary = await this.summaryModel.findById(contentId);
        if (!summary) {
          throw new NotFoundException(`Summary not found: ${contentId}`);
        }
        if (summary.teacherApprovalStatus !== 'pending_teacher') {
          throw new ForbiddenException('Summary is not pending teacher approval');
        }
        summary.teacherApprovalStatus = 'rejected';
        summary.teacherRejectionReason = reason;
        summary.approvedByTeacherId = teacherId;
        summary.teacherApprovalDate = new Date();
        const savedSummary = await summary.save();
        this.logger.log(`Teacher ${teacherId} rejected summary ${contentId}: ${reason}`);
        return savedSummary;
      
      case 'model_exam':
        const modelExam = await this.modelExamModel.findById(contentId);
        if (!modelExam) {
          throw new NotFoundException(`Model exam not found: ${contentId}`);
        }
        if (modelExam.teacherApprovalStatus !== 'pending_teacher') {
          throw new ForbiddenException('Model exam is not pending teacher approval');
        }
        modelExam.teacherApprovalStatus = 'rejected';
        modelExam.teacherRejectionReason = reason;
        modelExam.approvedByTeacherId = teacherId;
        modelExam.teacherApprovalDate = new Date();
        const savedExam = await modelExam.save();
        this.logger.log(`Teacher ${teacherId} rejected model exam ${contentId}: ${reason}`);
        return savedExam;
      
      default:
        throw new ForbiddenException(`Unknown content type: ${contentType}`);
    }
  }

  /**
   * Get count of pending approvals for teacher (all content types)
   * Uses cached teacher context to avoid repeated DB lookups.
   */
  async getPendingApprovalCount(teacherId: string): Promise<{
    total: number;
    questions: number;
    summaries: number;
    modelExams: number;
  }> {
    // Use cached teacher context (avoids 3 DB calls per request)
    const ctx = await this.getTeacherContext(teacherId);
    
    if (!ctx) {
      return { total: 0, questions: 0, summaries: 0, modelExams: 0 };
    }

    const { teacher, gradeTitle, subjectTitle } = ctx;

    const [questions, summaries, modelExams] = await Promise.all([
      this.questionModel.countDocuments({
        gradeId: teacher.gradeId,
        subjectId: teacher.subjectId,
        creatorType: 'admin',
        submissionStatus: 'pending',
      }),
      this.summaryModel.countDocuments({
        grade: gradeTitle,
        subject: subjectTitle,
        teacherApprovalStatus: 'pending_teacher',
      }),
      this.modelExamModel.countDocuments({
        subjectId: teacher.subjectId,
        teacherApprovalStatus: 'pending_teacher',
      }),
    ]);

    return {
      total: questions + summaries + modelExams,
      questions,
      summaries,
      modelExams,
    };
  }

  // ==================== EXAM BANK METHODS ====================

  /**
   * Store a question to teacher's private exam bank
   * Used when teacher approves content for personal exam use
   */
  async storeToExamBank(teacherId: string, questionId: string): Promise<TeacherExamBankDocument> {
    // Check if already stored
    const existing = await this.teacherExamBankModel.findOne({
      teacherId: new Types.ObjectId(teacherId),
      questionId,
    });

    if (existing) {
      this.logger.log(`Question ${questionId} already in teacher ${teacherId}'s exam bank`);
      return existing;
    }

    // Get the question details
    const question = await this.questionModel.findOne({ questionId }).lean();
    if (!question) {
      throw new NotFoundException(`Question not found: ${questionId}`);
    }

    // Store in exam bank with denormalized data
    const examBankEntry = new this.teacherExamBankModel({
      teacherId: new Types.ObjectId(teacherId),
      questionId: question.questionId,
      gradeId: question.gradeId,
      gradeTitle: question.gradeTitle,
      subjectId: question.subjectId,
      subjectTitle: question.subjectTitle,
      unitNumber: question.unitNumber,
      unitTitle: question.unitTitle,
      subunitNumber: question.subunitNumber,
      subunitTitle: question.subunitTitle,
      type: question.type,
      difficulty: question.difficulty,
      question: question.question,
      options: question.options || [],
      answer: question.answer,
      hint: question.hint,
      explanation: question.explanation,
    });

    const saved = await examBankEntry.save();
    this.logger.log(`Teacher ${teacherId} stored question ${questionId} to exam bank`);

    // Update original question status to approved
    await this.questionModel.updateOne(
      { questionId },
      { 
        $set: { 
          submissionStatus: 'approved',
          status: 'approved',
          reviewedBy: teacherId,
          reviewedAt: new Date(),
        }
      }
    );

    return saved;
  }

  /**
   * List questions in teacher's exam bank with filtering
   */
  async listExamBank(
    teacherId: string,
    filters: {
      unitNumber?: number;
      difficulty?: string;
      type?: string;
      search?: string;
    },
    page = 1,
    limit = 20,
  ): Promise<{
    questions: TeacherExamBankDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { teacherId: new Types.ObjectId(teacherId) };

    if (filters.unitNumber) query.unitNumber = filters.unitNumber;
    if (filters.difficulty) query.difficulty = filters.difficulty;
    if (filters.type) query.type = filters.type;
    if (filters.search) {
      query.question = { $regex: filters.search, $options: 'i' };
    }

    const [questions, total] = await Promise.all([
      this.teacherExamBankModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.teacherExamBankModel.countDocuments(query),
    ]);

    return {
      questions: questions as unknown as TeacherExamBankDocument[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get exam bank stats for teacher
   */
  async getExamBankStats(teacherId: string): Promise<{
    total: number;
    byDifficulty: { easy: number; medium: number; hard: number };
    byType: Record<string, number>;
  }> {
    const pipeline = [
      { $match: { teacherId: new Types.ObjectId(teacherId) } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byDifficulty: [
            { $group: { _id: '$difficulty', count: { $sum: 1 } } },
          ],
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } },
          ],
        },
      },
    ];

    const result = await this.teacherExamBankModel.aggregate(pipeline);
    const data = result[0];

    return {
      total: data.total[0]?.count || 0,
      byDifficulty: {
        easy: data.byDifficulty.find((d: any) => d._id === 'easy')?.count || 0,
        medium: data.byDifficulty.find((d: any) => d._id === 'medium')?.count || 0,
        hard: data.byDifficulty.find((d: any) => d._id === 'hard')?.count || 0,
      },
      byType: data.byType.reduce((acc: any, t: any) => {
        acc[t._id] = t.count;
        return acc;
      }, {}),
    };
  }

  /**
   * Remove question from exam bank
   */
  async removeFromExamBank(teacherId: string, questionId: string): Promise<void> {
    const result = await this.teacherExamBankModel.deleteOne({
      teacherId: new Types.ObjectId(teacherId),
      questionId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Question not in exam bank: ${questionId}`);
    }

    this.logger.log(`Teacher ${teacherId} removed question ${questionId} from exam bank`);
  }

  // ==================== EXAM CREATION METHODS ====================

  /**
   * Create a new exam
   */
  async createExam(
    teacherId: string,
    dto: {
      title: string;
      examType: 'quiz' | 'midterm' | 'final' | 'assignment';
      gradeId: string;
      subjectId: string;
      duration?: number;
      instructions?: string;
      schoolInfo?: { name?: string; address?: string; logo?: string };
    },
  ): Promise<TeacherExamDocument> {
    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(dto.gradeId).lean(),
      this.subjectModel.findById(dto.subjectId).lean(),
    ]);

    if (!grade) throw new NotFoundException(`Grade not found: ${dto.gradeId}`);
    if (!subject) throw new NotFoundException(`Subject not found: ${dto.subjectId}`);

    const exam = new this.teacherExamModel({
      examId: `EXAM_${uuidv4()}`,
      teacherId: new Types.ObjectId(teacherId),
      title: dto.title,
      examType: dto.examType,
      gradeId: new Types.ObjectId(dto.gradeId),
      gradeTitle: grade.title,
      subjectId: new Types.ObjectId(dto.subjectId),
      subjectTitle: subject.title,
      duration: dto.duration,
      instructions: dto.instructions || '',
      schoolInfo: dto.schoolInfo,
      questions: [],
      totalMarks: 0,
      status: 'draft',
    });

    const saved = await exam.save();
    this.logger.log(`Teacher ${teacherId} created exam: ${saved.examId}`);
    return saved;
  }

  /**
   * Get exam by ID
   */
  async getExam(teacherId: string, examId: string): Promise<TeacherExamDocument> {
    const exam = await this.teacherExamModel.findOne({
      examId,
      teacherId: new Types.ObjectId(teacherId),
    }).lean();

    if (!exam) {
      throw new NotFoundException(`Exam not found: ${examId}`);
    }

    return exam as unknown as TeacherExamDocument;
  }

  /**
   * List teacher's exams
   */
  async listExams(
    teacherId: string,
    filters: { examType?: string; status?: string } = {},
    page = 1,
    limit = 10,
  ): Promise<{
    exams: TeacherExamDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { teacherId: new Types.ObjectId(teacherId) };
    if (filters.examType) query.examType = filters.examType;
    if (filters.status) query.status = filters.status;

    const [exams, total] = await Promise.all([
      this.teacherExamModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.teacherExamModel.countDocuments(query),
    ]);

    return {
      exams: exams as unknown as TeacherExamDocument[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add questions to exam from exam bank
   */
  async addQuestionsToExam(
    teacherId: string,
    examId: string,
    questionIds: string[],
    defaultMarks = 1,
  ): Promise<TeacherExamDocument> {
    const exam = await this.teacherExamModel.findOne({
      examId,
      teacherId: new Types.ObjectId(teacherId),
      status: 'draft',
    });

    if (!exam) {
      throw new NotFoundException(`Exam not found or not editable: ${examId}`);
    }

    // Get questions from exam bank
    const bankQuestions = await this.teacherExamBankModel.find({
      teacherId: new Types.ObjectId(teacherId),
      questionId: { $in: questionIds },
    }).lean();

    if (bankQuestions.length === 0) {
      throw new NotFoundException('No questions found in exam bank');
    }

    // Add questions to exam
    const currentMaxOrder = exam.questions.length > 0 
      ? Math.max(...exam.questions.map((q: any) => q.order)) 
      : 0;

    for (let i = 0; i < bankQuestions.length; i++) {
      const bq = bankQuestions[i];
      
      // Skip if already in exam
      if (exam.questions.some((q: any) => q.questionId === bq.questionId)) {
        continue;
      }

      exam.questions.push({
        questionId: bq.questionId,
        question: bq.question,
        options: bq.options,
        answer: bq.answer,
        type: bq.type,
        difficulty: bq.difficulty,
        marks: defaultMarks,
        order: currentMaxOrder + i + 1,
        hint: bq.hint,
        explanation: bq.explanation,
      });

      // Update usage count in exam bank
      await this.teacherExamBankModel.updateOne(
        { _id: bq._id },
        { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } },
      );
    }

    // Recalculate total marks
    exam.totalMarks = exam.questions.reduce((sum: number, q: any) => sum + q.marks, 0);

    // Track units covered
    const units = [...new Set(bankQuestions.map(q => q.unitNumber))];
    exam.unitsCovered = [...new Set([...exam.unitsCovered, ...units])];

    await exam.save();
    this.logger.log(`Added ${bankQuestions.length} questions to exam ${examId}`);
    return exam;
  }

  /**
   * Remove question from exam
   */
  async removeQuestionFromExam(
    teacherId: string,
    examId: string,
    questionId: string,
  ): Promise<TeacherExamDocument> {
    const exam = await this.teacherExamModel.findOne({
      examId,
      teacherId: new Types.ObjectId(teacherId),
      status: 'draft',
    });

    if (!exam) {
      throw new NotFoundException(`Exam not found or not editable: ${examId}`);
    }

    exam.questions = exam.questions.filter((q: any) => q.questionId !== questionId);
    exam.totalMarks = exam.questions.reduce((sum: number, q: any) => sum + q.marks, 0);

    await exam.save();
    return exam;
  }

  /**
   * Update question marks in exam
   */
  async updateQuestionMarks(
    teacherId: string,
    examId: string,
    questionId: string,
    marks: number,
  ): Promise<TeacherExamDocument> {
    const exam = await this.teacherExamModel.findOne({
      examId,
      teacherId: new Types.ObjectId(teacherId),
      status: 'draft',
    });

    if (!exam) {
      throw new NotFoundException(`Exam not found or not editable: ${examId}`);
    }

    const question = exam.questions.find((q: any) => q.questionId === questionId);
    if (!question) {
      throw new NotFoundException(`Question not in exam: ${questionId}`);
    }

    question.marks = marks;
    exam.totalMarks = exam.questions.reduce((sum: number, q: any) => sum + q.marks, 0);

    await exam.save();
    return exam;
  }

  /**
   * Auto-build exam from exam bank based on blueprint
   */
  async autoBuildExam(
    teacherId: string,
    examId: string,
    blueprint: {
      totalQuestions: number;
      difficultyDistribution?: { easy?: number; medium?: number; hard?: number };
      typeDistribution?: Record<string, number>;
      units?: number[];
      defaultMarks?: number;
    },
  ): Promise<TeacherExamDocument> {
    const exam = await this.teacherExamModel.findOne({
      examId,
      teacherId: new Types.ObjectId(teacherId),
      status: 'draft',
    });

    if (!exam) {
      throw new NotFoundException(`Exam not found or not editable: ${examId}`);
    }

    // Build query for available questions
    const bankQuery: any = { teacherId: new Types.ObjectId(teacherId) };
    if (blueprint.units?.length) {
      bankQuery.unitNumber = { $in: blueprint.units };
    }

    // Get all available questions from exam bank
    const allQuestions = await this.teacherExamBankModel.find(bankQuery).lean();

    if (allQuestions.length === 0) {
      throw new NotFoundException('No questions available in exam bank matching criteria');
    }

    // Select questions based on distribution
    const selectedQuestions: any[] = [];
    const distribution = blueprint.difficultyDistribution || { easy: 30, medium: 50, hard: 20 };
    const total = blueprint.totalQuestions;

    // Calculate counts by difficulty
    const easyCount = Math.round((distribution.easy || 30) / 100 * total);
    const mediumCount = Math.round((distribution.medium || 50) / 100 * total);
    const hardCount = total - easyCount - mediumCount;

    // Group questions by difficulty
    const byDifficulty = {
      easy: allQuestions.filter(q => q.difficulty === 'easy'),
      medium: allQuestions.filter(q => q.difficulty === 'medium'),
      hard: allQuestions.filter(q => q.difficulty === 'hard'),
    };

    // Shuffle and select
    const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
    selectedQuestions.push(...shuffle(byDifficulty.easy).slice(0, easyCount));
    selectedQuestions.push(...shuffle(byDifficulty.medium).slice(0, mediumCount));
    selectedQuestions.push(...shuffle(byDifficulty.hard).slice(0, hardCount));

    // Clear existing questions and add selected ones
    exam.questions = [];
    const defaultMarks = blueprint.defaultMarks || 1;

    for (let i = 0; i < selectedQuestions.length; i++) {
      const q = selectedQuestions[i];
      exam.questions.push({
        questionId: q.questionId,
        question: q.question,
        options: q.options,
        answer: q.answer,
        type: q.type,
        difficulty: q.difficulty,
        marks: defaultMarks,
        order: i + 1,
        hint: q.hint,
        explanation: q.explanation,
      });
    }

    exam.totalMarks = exam.questions.reduce((sum: number, q: any) => sum + q.marks, 0);
    exam.unitsCovered = [...new Set(selectedQuestions.map(q => q.unitNumber))];
    exam.difficultyDistribution = {
      easy: exam.questions.filter((q: any) => q.difficulty === 'easy').length,
      medium: exam.questions.filter((q: any) => q.difficulty === 'medium').length,
      hard: exam.questions.filter((q: any) => q.difficulty === 'hard').length,
    };

    await exam.save();
    this.logger.log(`Auto-built exam ${examId} with ${selectedQuestions.length} questions`);
    return exam;
  }

  /**
   * Finalize exam (no more edits)
   */
  async finalizeExam(teacherId: string, examId: string): Promise<TeacherExamDocument> {
    const exam = await this.teacherExamModel.findOne({
      examId,
      teacherId: new Types.ObjectId(teacherId),
      status: 'draft',
    });

    if (!exam) {
      throw new NotFoundException(`Exam not found or already finalized: ${examId}`);
    }

    if (exam.questions.length === 0) {
      throw new ForbiddenException('Cannot finalize exam with no questions');
    }

    exam.status = 'finalized';
    await exam.save();
    this.logger.log(`Teacher ${teacherId} finalized exam ${examId}`);
    return exam;
  }

  /**
   * Delete draft exam
   */
  async deleteExam(teacherId: string, examId: string): Promise<void> {
    const result = await this.teacherExamModel.deleteOne({
      examId,
      teacherId: new Types.ObjectId(teacherId),
      status: 'draft',
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Draft exam not found: ${examId}`);
    }

    this.logger.log(`Teacher ${teacherId} deleted exam ${examId}`);
  }

  // ==================== HELPER METHODS ====================

  private getCollectionName(grade: string, subject: string): string {
    return `${grade}_${subject}`
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .toLowerCase();
  }
}

