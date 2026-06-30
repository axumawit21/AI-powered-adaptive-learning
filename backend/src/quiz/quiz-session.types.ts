// quiz-session.types.ts (recommended)
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
}

export interface StartSessionResponse {
  sessionId: string;
  question: QuizQuestion;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  message?: string;
  hint?: string;
  correctAnswer?: string;
  explanation?: string;
  askExplanation?: boolean;
}

export interface NextQuestionResponse {
  finished: boolean;
  message?: string;
  question?: QuizQuestion;
}
