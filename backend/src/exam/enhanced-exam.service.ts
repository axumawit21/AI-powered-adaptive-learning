import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { QuestionBankService } from '../question-bank/question-bank.service';
import { DifficultyLevel, QuestionType } from '../question-bank/schemas/question.schema';
import { ExamSession } from './schemas/exam-session.schema';
import { ProgressService } from '../progress/progress.service';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import { Book } from '../books/book.schema';

/**
 * Enhanced Exam Configuration
 */
export interface ExamConfig {
  studentId: string;
  subjectId: string;
  gradeId?: string;
  type: 'unit' | 'subject' | 'comprehensive';
  unitNumber?: number;
  unitTitle?: string;
  questionCount?: number;
  difficulty?: DifficultyLevel | 'progressive'; // Progressive = Easy -> Medium -> Hard
  timeLimit?: number; // in minutes
}

export interface ExamQuestion {
  questionId: string;
  questionText: string;
  type: QuestionType;
  options?: string[];
  pairs?: { left: string; right: string }[];
  difficulty: DifficultyLevel;
}

export interface GeneratedExam {
  examId: string;
  questions: ExamQuestion[];
  totalQuestions: number;
  timeLimit?: number;
  type: 'unit' | 'subject' | 'comprehensive';
  availableQuestions: number;
}

export interface ExamSubmission {
  examId: string;
  answers: { questionIndex: number; answer: string }[];
}

export interface ExamResult {
  examId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  details: {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  weakAreas: string[];
  recommendations: string[];
}

@Injectable()
export class EnhancedExamService {
  private readonly logger = new Logger(EnhancedExamService.name);
  private readonly PASS_THRESHOLD = 60; // 60% to pass

  constructor(
    @InjectModel(ExamSession.name) private examModel: Model<ExamSession>,
    @InjectModel(Grade.name) private gradeModel: Model<Grade>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
    private readonly questionBankService: QuestionBankService,
    private readonly progressService: ProgressService,
  ) {}

  /**
   * Generate an exam with non-repeating questions from the question bank
   */
  async generateExam(config: ExamConfig): Promise<GeneratedExam> {
    const {
      studentId,
      subjectId,
      gradeId,
      type,
      unitNumber,
      unitTitle,
      questionCount = 20,
      difficulty = 'progressive',
      timeLimit = 30,
    } = config;

    // 0. Resolve Subject and Grade IDs if they might be titles or Book IDs
    let resolvedSubjectId = subjectId;
    let resolvedGradeId = gradeId;

    if (subjectId) {
      if (/^[0-9a-fA-F]{24}$/.test(subjectId)) {
        // It's a valid hex string, check if it's a Subject or a Book
        const subjectExists = await this.subjectModel.exists({ _id: new Types.ObjectId(subjectId) });
        if (!subjectExists) {
          // If not a subject, it might be a Book ID
          const book = await this.bookModel.findById(subjectId);
          if (book && book.subject) {
            resolvedSubjectId = (book.subject as any)._id?.toString() || book.subject.toString();
            this.logger.log(`Resolved Book ID ${subjectId} to Subject ID ${resolvedSubjectId}`);
          }
        }
      } else {
        // It's a title
        const s = await this.subjectModel.findOne({ title: new RegExp(subjectId, 'i') });
        if (s) resolvedSubjectId = (s as any)._id.toString();
      }
    }

    if (gradeId && !/^[0-9a-fA-F]{24}$/.test(gradeId)) {
      // Handle 'grade_9' -> 'Grade 9' etc.
      const normalizedGrade = gradeId.replace('_', ' ');
      const g = await this.gradeModel.findOne({ title: new RegExp(normalizedGrade, 'i') });
      if (g) resolvedGradeId = (g as any)._id.toString();
      else if (gradeId === 'grade_9') {
        const g9 = await this.gradeModel.findOne({ title: /Grade 9/i });
        if (g9) resolvedGradeId = (g9 as any)._id.toString();
      }
    }

    // 1. Check available questions
    const availability = await this.questionBankService.checkAvailableQuestions({
      studentId,
      subjectId: resolvedSubjectId,
      gradeId: /^[0-9a-fA-F]{24}$/.test(resolvedGradeId || '') ? resolvedGradeId : undefined,
      unitNumber: type === 'unit' ? unitNumber : undefined,
    });

    if (availability.available < 5) {
      throw new BadRequestException(
        `Not enough unattempted questions for an exam. Only ${availability.available} questions available. Minimum required: 5`
      );
    }

    const actualQuestionCount = Math.min(questionCount, availability.available);

    // 2. Fetch questions based on difficulty strategy
    let questions: any[];

    if (difficulty === 'progressive') {
      // Progressive difficulty: Easy 30%, Medium 40%, Hard 30%
      questions = await this.fetchProgressiveQuestions(
        studentId,
        resolvedSubjectId,
        /^[0-9a-fA-F]{24}$/.test(resolvedGradeId || '') ? resolvedGradeId : undefined,
        type === 'unit' ? unitNumber : undefined,
        actualQuestionCount
      );
    } else {
      // Single difficulty
      questions = await this.questionBankService.fetchQuestionsForStudent({
        studentId,
        subjectId: resolvedSubjectId,
        gradeId: /^[0-9a-fA-F]{24}$/.test(resolvedGradeId || '') ? resolvedGradeId : undefined,
        unitNumber: type === 'unit' ? unitNumber : undefined,
        difficulty,
        count: actualQuestionCount,
        context: 'exam',
      });
    }

    if (questions.length === 0) {
      throw new BadRequestException('Could not generate exam questions. This might be because you have already attempted all available questions for this subject/unit.');
    }

    // 3. Create exam session in database
    const examSession = await this.examModel.create({
      studentId,
      subjectId: resolvedSubjectId,
      gradeId: /^[0-9a-fA-F]{24}$/.test(resolvedGradeId || '') ? resolvedGradeId : undefined,
      unitId: unitNumber?.toString(),
      type: type === 'comprehensive' ? 'subject' : type,
      totalQuestions: questions.length,
      questions: questions.map(q => ({
        questionText: q.question,
        type: this.mapQuestionType(q.type),
        options: q.options,
        correctAnswer: q.answer,
      })),
      completed: false,
    });

    // Store question IDs for tracking (we'll record them on submission)
    this.storeExamQuestionIds((examSession as any)._id.toString(), questions.map(q => q.questionId));

    // 4. Format questions for client (remove answers)
    const formattedQuestions: ExamQuestion[] = questions.map((q, index) => ({
      questionId: q.questionId,
      questionText: q.question,
      type: q.type,
      options: q.options,
      pairs: q.pairs,
      difficulty: q.difficulty,
    }));

    this.logger.log(`Exam ${(examSession as any)._id} generated for student ${studentId} with ${questions.length} questions`);

    return {
      examId: (examSession as any)._id.toString(),
      questions: formattedQuestions,
      totalQuestions: questions.length,
      timeLimit,
      type,
      availableQuestions: availability.available - questions.length,
    };
  }

  /**
   * Submit exam answers and get results
   */
  async submitExam(studentId: string, submission: ExamSubmission): Promise<ExamResult> {
    const exam = await this.examModel.findOne({
      _id: submission.examId,
      studentId,
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.completed) {
      throw new BadRequestException('This exam has already been submitted');
    }

    // Get stored question IDs for tracking
    const questionIds = this.getExamQuestionIds(submission.examId);

    // Grade the exam
    let correctCount = 0;
    const details: ExamResult['details'] = [];
    const incorrectTopics: string[] = [];

    submission.answers.forEach(ans => {
      const question = exam.questions[ans.questionIndex];
      if (!question) return;

      const isCorrect = this.validateExamAnswer(question, ans.answer);
      
      question.studentAnswer = ans.answer;
      question.isCorrect = isCorrect;

      if (isCorrect) {
        correctCount++;
      } else {
        // Track incorrect topics for weak areas analysis
        incorrectTopics.push(question.questionText.substring(0, 50));
      }

      details.push({
        questionId: questionIds[ans.questionIndex] || `q_${ans.questionIndex}`,
        questionText: question.questionText,
        userAnswer: ans.answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: '', // We'd need to store this from the question bank
      });
    });

    // Update exam record
    exam.score = correctCount;
    exam.completed = true;
    exam.completedAt = new Date();
    await exam.save();

    // Record attempted questions
    if (questionIds.length > 0) {
      const results = details.map(d => ({
        questionId: d.questionId,
        wasCorrect: d.isCorrect,
      }));

      await this.questionBankService.recordAttemptedQuestions({
        studentId,
        subjectId: exam.subjectId,
        gradeId: exam.gradeId,
        unitNumber: exam.unitId ? parseInt(exam.unitId) : undefined,
        questionIds,
        context: 'exam',
        sessionId: submission.examId,
        results,
      });
    }

    // Update progress
    try {
      // Resolve subject and grade titles for proper dashboard display
      let subjectTitle = 'Unknown Subject';
      let gradeTitle = 'Unknown Grade';
      
      if (exam.subjectId) {
        const subject = await this.subjectModel.findById(exam.subjectId);
        if (subject) subjectTitle = subject.title;
      }
      
      if (exam.gradeId) {
        const grade = await this.gradeModel.findById(exam.gradeId);
        if (grade) gradeTitle = grade.title;
      }

      await this.progressService.addExamResult(studentId, {
        bookId: `${exam.subjectId}_${exam.gradeId || 'General'}`,
        gradeId: exam.gradeId,
        subjectId: exam.subjectId,
        score: correctCount,
        totalQuestions: exam.totalQuestions,
      });

      // Calculate and record actual study time (exam duration)
      const examStartTime = exam.createdAt ? new Date(exam.createdAt).getTime() : Date.now();
      const durationMs = Date.now() - examStartTime;
      const durationMinutes = Math.max(1, Math.round(durationMs / 60000)); // At least 1 minute
      this.logger.log(`Exam duration: ${durationMinutes} minutes for student ${studentId}`);
      
      await this.progressService.addTime(
        studentId,
        `${exam.subjectId}_${exam.gradeId || 'General'}`,
        durationMinutes,
        exam.gradeId,
        exam.subjectId,
        gradeTitle,
        subjectTitle
      );
    } catch (err) {
      this.logger.error(`Failed to update progress: ${err.message}`);
    }

    // Calculate results
    const percentage = Math.round((correctCount / exam.totalQuestions) * 100);
    const passed = percentage >= this.PASS_THRESHOLD;

    // Generate weak areas and recommendations
    const weakAreas = this.identifyWeakAreas(details);
    const recommendations = this.generateRecommendations(percentage, weakAreas);

    // Cleanup stored question IDs
    this.clearExamQuestionIds(submission.examId);

    this.logger.log(`Exam ${submission.examId} submitted: ${correctCount}/${exam.totalQuestions} (${percentage}%)`);

    return {
      examId: submission.examId,
      score: correctCount,
      totalQuestions: exam.totalQuestions,
      percentage,
      passed,
      details,
      weakAreas,
      recommendations,
    };
  }

  /**
   * Get exam history for a student
   */
  async getExamHistory(studentId: string, subjectId?: string): Promise<any[]> {
    const query: any = { studentId, completed: true };
    if (subjectId) query.subjectId = subjectId;

    const exams = await this.examModel
      .find(query)
      .sort({ completedAt: -1 })
      .select('_id subjectId type score totalQuestions completedAt createdAt')
      .lean();

    // Fetch unique subject IDs from exams
    const subjectIds = [...new Set(exams.map(e => e.subjectId))].filter(id => id && Types.ObjectId.isValid(id));
    const subjectsMap = new Map();
    
    if (subjectIds.length > 0) {
      const subjects = await this.subjectModel.find({ _id: { $in: subjectIds.map(id => new Types.ObjectId(id)) } }).select('_id title').lean();
      subjects.forEach(s => subjectsMap.set(s._id.toString(), s.title));
    }

    return exams.map(e => ({
      examId: e._id,
      subjectId: e.subjectId,
      subjectName: subjectsMap.get(e.subjectId.toString()) || 'Unknown Subject',
      type: e.type,
      score: e.score,
      totalQuestions: e.totalQuestions,
      percentage: Math.round((e.score / e.totalQuestions) * 100),
      completedAt: e.completedAt,
      createdAt: e.createdAt,
    }));
  }

  /**
   * Get detailed exam results
   */
  async getExamResults(examId: string, studentId: string): Promise<any> {
    const exam = await this.examModel.findOne({ _id: examId, studentId });
    
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return {
      examId: exam._id,
      type: exam.type,
      score: exam.score,
      totalQuestions: exam.totalQuestions,
      percentage: Math.round((exam.score / exam.totalQuestions) * 100),
      passed: Math.round((exam.score / exam.totalQuestions) * 100) >= this.PASS_THRESHOLD,
      questions: exam.questions.map((q, i) => ({
        questionNumber: i + 1,
        questionText: q.questionText,
        type: q.type,
        options: q.options,
        userAnswer: q.studentAnswer || 'Not answered',
        correctAnswer: q.correctAnswer,
        isCorrect: q.isCorrect,
      })),
      completedAt: exam.completedAt,
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Fetch questions with progressive difficulty distribution
   */
  private async fetchProgressiveQuestions(
    studentId: string,
    subjectId: string,
    gradeId: string | undefined,
    unitNumber: number | undefined,
    totalCount: number
  ): Promise<any[]> {
    const easyCount = Math.ceil(totalCount * 0.3);
    const mediumCount = Math.ceil(totalCount * 0.4);
    const hardCount = totalCount - easyCount - mediumCount;

    const [easy, medium, hard] = await Promise.all([
      this.questionBankService.fetchQuestionsForStudent({
        studentId,
        subjectId,
        gradeId,
        unitNumber,
        difficulty: 'easy',
        count: easyCount,
        context: 'exam',
      }),
      this.questionBankService.fetchQuestionsForStudent({
        studentId,
        subjectId,
        gradeId,
        unitNumber,
        difficulty: 'medium',
        count: mediumCount,
        context: 'exam',
      }),
      this.questionBankService.fetchQuestionsForStudent({
        studentId,
        subjectId,
        gradeId,
        unitNumber,
        difficulty: 'hard',
        count: hardCount,
        context: 'exam',
      }),
    ]);

    // Arrange in progressive order: easy first, then medium, then hard
    return [...easy, ...medium, ...hard];
  }

  private validateExamAnswer(question: any, userAnswer: string): boolean {
    if (!userAnswer || !question.correctAnswer) return false;

    const normUser = userAnswer.trim().toLowerCase();
    const normCorrect = question.correctAnswer.trim().toLowerCase();

    // For MCQ, match letter or full option
    if (question.type === 'multiple_choice') {
      return normUser === normCorrect || normUser.startsWith(normCorrect);
    }

    return normUser === normCorrect || normUser.includes(normCorrect);
  }

  private mapQuestionType(type: QuestionType): 'multiple_choice' | 'true_false' | 'fill_blank' {
    const typeMap: Record<string, 'multiple_choice' | 'true_false' | 'fill_blank'> = {
      'mcq': 'multiple_choice',
      'true-false': 'true_false',
      'fill-blank': 'fill_blank',
      'short-answer': 'fill_blank',
      'matching': 'multiple_choice',
    };
    return typeMap[type] || 'multiple_choice';
  }

  private identifyWeakAreas(details: ExamResult['details']): string[] {
    const incorrect = details.filter(d => !d.isCorrect);
    // Extract topics from incorrect questions (simplified)
    return incorrect.slice(0, 3).map(d => d.questionText.substring(0, 50) + '...');
  }

  private generateRecommendations(percentage: number, weakAreas: string[]): string[] {
    const recommendations: string[] = [];

    if (percentage < 40) {
      recommendations.push('Review the fundamental concepts of this topic');
      recommendations.push('Practice with easier questions before attempting the exam again');
    } else if (percentage < 60) {
      recommendations.push('Focus on understanding the concepts you missed');
      recommendations.push('Try the practice quizzes for targeted improvement');
    } else if (percentage < 80) {
      recommendations.push('Good progress! Focus on the harder concepts to improve further');
    } else {
      recommendations.push('Excellent work! You have mastered this topic');
    }

    if (weakAreas.length > 0) {
      recommendations.push(`Review topics related to: ${weakAreas[0]}`);
    }

    return recommendations;
  }

  // Temporary storage for exam question IDs (in production, use Redis or database)
  private examQuestionIdsMap = new Map<string, string[]>();

  private storeExamQuestionIds(examId: string, questionIds: string[]): void {
    this.examQuestionIdsMap.set(examId, questionIds);
  }

  private getExamQuestionIds(examId: string): string[] {
    return this.examQuestionIdsMap.get(examId) || [];
  }

  private clearExamQuestionIds(examId: string): void {
    this.examQuestionIdsMap.delete(examId);
  }
}
