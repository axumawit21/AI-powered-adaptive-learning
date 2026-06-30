// quiz-session.service.ts
import { Injectable } from '@nestjs/common';
import { QuizQuestion, StartSessionResponse, SubmitAnswerResponse, NextQuestionResponse } from './quiz-session.types';
import { ProgressService } from '../progress/progress.service';

interface QuizSession {
  quizId: string;
  currentIndex: number;
  attempts: number;
  questions: QuizQuestion[];
  studentId?: string;
  gradeId?: string;
  subjectId?: string;
  bookId?: string;
  unitNumber?: string;
  correctAnswers: number;
  totalQuestions: number;
}

@Injectable()
export class QuizSessionService {
  private sessions = new Map<string, QuizSession>();

  constructor(private readonly progressService: ProgressService) {}

  startSession(quiz: any, metadata?: { studentId?: string; gradeId?: string; subjectId?: string; bookId?: string; unitNumber?: string }): StartSessionResponse {
    const sessionId = crypto.randomUUID();

    this.sessions.set(sessionId, {
      quizId: quiz._id.toString(),
      currentIndex: 0,
      attempts: 0,
      questions: quiz.questions,
      studentId: metadata?.studentId,
      gradeId: metadata?.gradeId,
      subjectId: metadata?.subjectId,
      bookId: metadata?.bookId,
      unitNumber: metadata?.unitNumber || quiz.unit,
      correctAnswers: 0,
      totalQuestions: quiz.questions.length,
    });

    return {
      sessionId,
      question: quiz.questions[0],
    };
  }


  submitAnswer(sessionId: string, selected: string): SubmitAnswerResponse {
    const session = this.sessions.get(sessionId);
    if (!session) return { correct: false, message: 'Session not found' };

    const currentQuestion = session.questions[session.currentIndex];
    
    // Validate answer based on question type
    const isCorrect = this.validateAnswer(currentQuestion, selected);

    if (session.attempts === 0) {
      if (isCorrect) {
        session.attempts = 0;
        session.correctAnswers++;
        return { correct: true, message: "🎉 Great job! You're doing amazing!" };
      } else {
        session.attempts = 1;
        return { correct: false, message: '❌ Not quite. Try again!', hint: currentQuestion.hint };
      }
    } else {
      session.attempts = 0;
      if (isCorrect) {
        session.correctAnswers++;
        return { correct: true, message: '✔️ Correct on the second try! Keep going!' };
      }
      return { correct: false, correctAnswer: currentQuestion.answer, explanation: currentQuestion.explanation, askExplanation: true };
    }
  }

  private validateAnswer(question: any, userAnswer: string): boolean {
    const questionType = question.type || 'mcq'; // Default to MCQ for backward compatibility
    
    switch (questionType) {
      case 'mcq':
        // Exact match for MCQ (e.g., "A" === "A")
        return userAnswer.trim().toUpperCase() === question.answer.trim().toUpperCase();
      
      case 'true-false':
        // Case-insensitive match for true/false
        return userAnswer.trim().toLowerCase() === question.answer.trim().toLowerCase();
      
      case 'fill-blank':
      case 'short-answer':
        // Case-insensitive, trimmed match for fill-blank and short answer
        // Could be enhanced with fuzzy matching or keyword detection
        const userAnswerNormalized = userAnswer.trim().toLowerCase();
        const correctAnswerNormalized = question.answer.trim().toLowerCase();
        
        // Check for exact match or if user answer contains key words
        if (userAnswerNormalized === correctAnswerNormalized) return true;
        
        // For short answers, check if key words are present
        if (questionType === 'short-answer') {
          const keywords = correctAnswerNormalized.split(' ').filter(word => word.length > 3);
          const matchedKeywords = keywords.filter(keyword => userAnswerNormalized.includes(keyword));
          return matchedKeywords.length >= keywords.length * 0.6; // 60% keyword match
        }
        
        return false;
      
      case 'matching':
        // For matching, expect JSON string of pairs
        try {
          const userPairs = JSON.parse(userAnswer);
          const correctPairs = question.pairs;
          
          // Check if all pairs match
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

  async nextQuestion(sessionId: string): Promise<NextQuestionResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { finished: true, message: 'Session not found' };
    }

    session.currentIndex++;

    if (session.currentIndex >= session.questions.length) {
      // Quiz completed - track progress
      if (session.studentId) {
        try {
          await this.progressService.addQuizResult(session.studentId, {
            bookId: session.bookId,
            gradeId: session.gradeId,
            subjectId: session.subjectId,
            unitNumber: session.unitNumber,
            score: session.correctAnswers,
            totalQuestions: session.totalQuestions,
            answers: [],
          });
        } catch (error) {
          // Silently fail progress tracking — quiz completion is more important
        }
      }
      
      // Clean up session
      this.sessions.delete(sessionId);
      
      return { finished: true, message: '🎉 You completed the quiz! Excellent work!' };
    }

    return { finished: false, question: session.questions[session.currentIndex] };
  }
}
