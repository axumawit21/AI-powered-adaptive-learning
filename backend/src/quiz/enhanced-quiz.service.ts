import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { QuestionBankService } from '../question-bank/question-bank.service';
import { DifficultyLevel, QuestionType } from '../question-bank/schemas/question.schema';
import { ProgressService } from '../progress/progress.service';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import { Book } from '../books/book.schema';

/**
 * Enhanced Quiz Session Types
 */
export interface QuizConfig {
  studentId: string;
  subjectId: string;
  gradeId?: string;
  unitNumber?: number;
  unitTitle?: string;
  subunitNumber?: string;
  subunitTitle?: string;
  difficulty?: DifficultyLevel | 'mixed';
  questionCount?: number;
  questionTypes?: QuestionType[];
  bookId?: string;
}

export interface QuizSession {
  sessionId: string;
  studentId: string;
  subjectId: string;
  gradeId?: string;
  unitNumber?: number;
  unitTitle?: string;
  questions: any[];
  currentIndex: number;
  attempts: number;
  correctAnswers: number;
  totalQuestions: number;
  questionIds: string[];
  createdAt: Date;
  startedAt: Date; // Track when quiz actually started for duration calculation
  status: 'active' | 'completed' | 'abandoned';
}

export interface StartQuizResponse {
  sessionId: string;
  totalQuestions: number;
  question: any;
  availableQuestions: number;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  message: string;
  hint?: string;
  correctAnswer?: string;
  explanation?: string;
  askExplanation?: boolean;
}

export interface NextQuestionResponse {
  finished: boolean;
  question?: any;
  message?: string;
  score?: number;
  totalQuestions?: number;
}

@Injectable()
export class EnhancedQuizService {
  private readonly logger = new Logger(EnhancedQuizService.name);
  private sessions = new Map<string, QuizSession>();

  constructor(
    private readonly questionBankService: QuestionBankService,
    private readonly progressService: ProgressService,
    @InjectModel(Grade.name) private gradeModel: Model<Grade>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
  ) {}

  /**
   * Start a new quiz session with non-repeating questions
   */
  async startQuiz(config: QuizConfig): Promise<StartQuizResponse> {
    const {
      studentId,
      subjectId,
      gradeId,
      unitNumber,
      unitTitle,
      subunitNumber,
      difficulty = 'mixed',
      questionCount = 10,
      questionTypes = ['mcq', 'true-false', 'fill-blank'],
      bookId,
    } = config;

    this.logger.log(`Starting quiz for student ${studentId}, subject=${subjectId}`);

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
      unitNumber,
      difficulty: difficulty === 'mixed' ? undefined : difficulty,
      // Strict filtering: pass types if provided
      questionTypes: questionTypes && questionTypes.length > 0 ? questionTypes : undefined,
    });



    if (availability.available === 0) {
      const typeMsg = questionTypes && questionTypes.length > 0 ? ` (Types: ${questionTypes.join(', ')})` : '';
      const diffMsg = difficulty !== 'mixed' ? ` (Difficulty: ${difficulty})` : '';
      throw new BadRequestException(
        `No unattempted questions available for this unit${diffMsg}${typeMsg}. You have completed all ${availability.total} questions!`
      );
    }

    // 2. Fetch questions (non-repeating)
    let questions: any[];
    
    // Strict logic: explicit types override defaults
    questions = await this.questionBankService.fetchQuestionsForStudent({
      studentId,
      subjectId: resolvedSubjectId,
      gradeId: /^[0-9a-fA-F]{24}$/.test(resolvedGradeId || '') ? resolvedGradeId : undefined,
      unitNumber,
      subunitNumber,
      difficulty: difficulty === 'mixed' ? undefined : difficulty,
      count: Math.min(questionCount, availability.available),
      questionTypes: questionTypes && questionTypes.length > 0 ? questionTypes : undefined,
      context: 'quiz',
    });

    if (questions.length === 0) {
      throw new BadRequestException('Could not fetch unattempted questions for this selection. This might be because you have already completed all available questions for this unit.');
    }

    // 3. Create session
    const sessionId = uuidv4();
    const now = new Date();
    const session: QuizSession = {
      sessionId,
      studentId,
      subjectId: resolvedSubjectId,
      gradeId: /^[0-9a-fA-F]{24}$/.test(resolvedGradeId || '') ? resolvedGradeId : undefined,
      unitNumber,
      unitTitle,
      questions,
      currentIndex: 0,
      attempts: 0,
      correctAnswers: 0,
      totalQuestions: questions.length,
      questionIds: questions.map(q => q.questionId),
      createdAt: now,
      startedAt: now, // Track start time for duration
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    this.logger.log(`Quiz session ${sessionId} started for student ${studentId} with ${questions.length} questions`);

    return {
      sessionId,
      totalQuestions: questions.length,
      question: this.formatQuestionForClient(questions[0]),
      availableQuestions: availability.available - questions.length,
    };
  }

  /**
   * Submit an answer for the current question
   */
  submitAnswer(sessionId: string, selectedAnswer: string): SubmitAnswerResponse {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { correct: false, message: 'Session not found or expired' };
    }

    if (session.status !== 'active') {
      return { correct: false, message: 'Quiz session is no longer active' };
    }

    const currentQuestion = session.questions[session.currentIndex];
    const isCorrect = this.validateAnswer(currentQuestion, selectedAnswer);

    if (session.attempts === 0) {
      // First attempt
      if (isCorrect) {
        session.correctAnswers++;
        session.attempts = 0; // Reset for next question
        return { 
          correct: true, 
          message: "🎉 Excellent! You got it on the first try!",
          explanation: currentQuestion.explanation,
          correctAnswer: currentQuestion.answer
        };
      } else {
        session.attempts = 1;
        return {
          correct: false,
          message: '❌ Not quite right. Try again!',
          hint: currentQuestion.hint,
        };
      }
    } else {
      // Second attempt
      session.attempts = 0; // Reset for next question
      if (isCorrect) {
        session.correctAnswers++;
        return { 
          correct: true, 
          message: '✅ Correct on the second try! Keep going!',
          explanation: currentQuestion.explanation,
          correctAnswer: currentQuestion.answer
        };
      }
      return {
        correct: false,
        correctAnswer: currentQuestion.answer,
        explanation: currentQuestion.explanation,
        askExplanation: true,
        message: `The correct answer was: ${currentQuestion.answer}`,
      };
    }
  }

  /**
   * Move to the next question
   */
  async nextQuestion(sessionId: string): Promise<NextQuestionResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { finished: true, message: 'Session not found' };
    }

    session.currentIndex++;

    if (session.currentIndex >= session.questions.length) {
      // Quiz completed
      session.status = 'completed';

      // Record attempted questions
      await this.questionBankService.recordAttemptedQuestions({
        studentId: session.studentId,
        subjectId: session.subjectId,
        gradeId: session.gradeId,
        unitNumber: session.unitNumber,
        questionIds: session.questionIds,
        context: 'quiz',
        sessionId,
      });

      // Update progress
      try {
        // Resolve subject and grade titles for proper dashboard display
        let subjectTitle = 'Unknown Subject';
        let gradeTitle = 'Unknown Grade';
        
        if (session.subjectId) {
          const subject = await this.subjectModel.findById(session.subjectId);
          if (subject) subjectTitle = subject.title;
        }
        
        if (session.gradeId) {
          const grade = await this.gradeModel.findById(session.gradeId);
          if (grade) gradeTitle = grade.title;
        }
        
        await this.progressService.addQuizResult(session.studentId, {
          bookId: `${session.subjectId}_${session.gradeId || 'General'}`,
          gradeId: session.gradeId,
          subjectId: session.subjectId,
          subjectTitle,
          gradeTitle,
          unitNumber: session.unitNumber?.toString(),
          unitTitle: session.unitTitle,
          score: session.correctAnswers,
          totalQuestions: session.totalQuestions,
          answers: [],
        });

        // Calculate and record actual study time (quiz duration)
        const durationMs = Date.now() - session.startedAt.getTime();
        const durationMinutes = Math.max(1, Math.round(durationMs / 60000)); // At least 1 minute
        this.logger.log(`Quiz duration: ${durationMinutes} minutes for student ${session.studentId}`);
        
        await this.progressService.addTime(
          session.studentId,
          `${session.subjectId}_${session.gradeId || 'General'}`,
          durationMinutes,
          session.gradeId,
          session.subjectId,
          gradeTitle,
          subjectTitle
        );
      } catch (err) {
        this.logger.error(`Failed to update progress: ${err.message}`);
      }

      // Calculate score
      const scorePercent = Math.round((session.correctAnswers / session.totalQuestions) * 100);

      // Cleanup session
      this.sessions.delete(sessionId);

      return {
        finished: true,
        message: `🎉 Quiz completed! Score: ${session.correctAnswers}/${session.totalQuestions} (${scorePercent}%)`,
        score: session.correctAnswers,
        totalQuestions: session.totalQuestions,
      };
    }

    return {
      finished: false,
      question: this.formatQuestionForClient(session.questions[session.currentIndex]),
    };
  }

  /**
   * Abandon a quiz session
   */
  async abandonQuiz(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'abandoned';
      
      // Still record the attempted questions to prevent repetition
      // even though quiz was abandoned
      const attemptedIds = session.questionIds.slice(0, session.currentIndex + 1);
      if (attemptedIds.length > 0) {
        await this.questionBankService.recordAttemptedQuestions({
          studentId: session.studentId,
          subjectId: session.subjectId,
          gradeId: session.gradeId,
          unitNumber: session.unitNumber,
          questionIds: attemptedIds,
          context: 'quiz',
          sessionId,
        });
      }

      this.sessions.delete(sessionId);
      this.logger.log(`Quiz session ${sessionId} abandoned`);
    }
  }

  /**
   * Get current session status
   */
  getSessionStatus(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      currentQuestion: session.currentIndex + 1,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      status: session.status,
    };
  }

  // ==================== HELPER METHODS ====================

  private validateAnswer(question: any, userAnswer: string): boolean {
    const questionType = question.type || 'mcq';

    switch (questionType) {
      case 'mcq':
        return userAnswer.trim().toUpperCase() === question.answer.trim().toUpperCase();

      case 'true-false':
        return userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();

      case 'fill-blank':
      case 'short-answer':
        if (typeof userAnswer !== 'string' || typeof question.answer !== 'string') return false;
        const userNorm = userAnswer.trim().toLowerCase();
        const correctNorm = question.answer.trim().toLowerCase();

        if (userNorm === correctNorm) return true;

        // Fuzzy matching for short answers
        if (questionType === 'short-answer') {
          const keywords = correctNorm.split(' ').filter((w: string) => w.length > 3);
          const matched = keywords.filter((kw: string) => userNorm.includes(kw));
          return matched.length >= keywords.length * 0.6;
        }

        return false;

      case 'matching':
        try {
          const userPairs = JSON.parse(userAnswer);
          const correctPairs = question.pairs;
          return correctPairs.every((pair: any) =>
            userPairs.some((up: any) => up.left === pair.left && up.right === pair.right)
          );
        } catch {
          return false;
        }

      default:
        return userAnswer.trim() === question.answer.trim();
    }
  }

  private formatQuestionForClient(question: any): any {
    // Remove the answer and explanation from client response
    const { answer, explanation, ...clientQuestion } = question;
    return {
      ...clientQuestion,
      questionNumber: question.questionId,
    };
  }
}
