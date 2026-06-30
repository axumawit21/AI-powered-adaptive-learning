import api from './api';

export const teacherApi = {
  // Dashboard
  getDashboard: async () => {
    const res = await api.get('teacher/dashboard');
    return res.data;
  },

  // Questions CRUD
  createQuestion: async (data) => {
    const res = await api.post('teacher/questions', data);
    return res.data;
  },

  listQuestions: async (params = {}) => {
    const res = await api.get('teacher/questions', { params });
    return res.data;
  },

  getQuestion: async (questionId) => {
    const res = await api.get(`teacher/questions/${questionId}`);
    return res.data;
  },

  updateQuestion: async (questionId, data) => {
    const res = await api.put(`teacher/questions/${questionId}`, data);
    return res.data;
  },

  deleteQuestion: async (questionId) => {
    const res = await api.delete(`teacher/questions/${questionId}`);
    return res.data;
  },

  submitQuestion: async (questionId) => {
    const res = await api.post(`teacher/questions/${questionId}/submit`);
    return res.data;
  },

  duplicateQuestion: async (questionId, data) => {
    const res = await api.post(`teacher/questions/${questionId}/duplicate`, data);
    return res.data;
  },

  // AI Tools
  improveQuestion: async (questionId) => {
    const res = await api.post('teacher/ai/improve', { questionId });
    return res.data;
  },

  generateVariations: async (questionId, count = 3) => {
    const res = await api.post('teacher/ai/variations', { questionId, count });
    return res.data;
  },

  predictDifficulty: async (question, gradeId) => {
    const res = await api.post('teacher/ai/difficulty', { question, gradeId });
    return res.data;
  },

  generateAnswer: async (question, type, options) => {
    const res = await api.post('teacher/ai/answer', { question, type, options });
    return res.data;
  },

  checkAlignment: async (question, gradeId, subjectId, unitNumber) => {
    const res = await api.post('teacher/ai/alignment', {
      question,
      gradeId,
      subjectId,
      unitNumber,
    });
    return res.data;
  },

  // Generate a complete question using AI (with context from curriculum)
  generateFullQuestion: async (data) => {
    const res = await api.post('teacher/ai/generate-question', data);
    return res.data;
  },

  // Generate multiple questions in 1 API call (saves quota)
  generateBatchQuestions: async (data) => {
    const res = await api.post('teacher/ai/generate-questions-batch', data);
    return res.data;
  },

  // ==================== EXAM BANK ====================

  /**
   * Store a question to teacher's private exam bank
   * @param {string} questionId - The question ID to store
   * @returns {Promise<Object>} The stored exam bank entry
   */
  storeToExamBank: async (questionId) => {
    const res = await api.post(`teacher/exam-bank/${questionId}`);
    return res.data;
  },

  /**
   * List teacher's exam bank with optional filtering
   * @param {Object} params - Query params: page, limit, unitNumber, difficulty, type, search
   * @returns {Promise<{questions: Array, total: number, page: number, totalPages: number}>}
   */
  listExamBank: async (params = {}) => {
    const res = await api.get('teacher/exam-bank', { params });
    return res.data;
  },

  /**
   * Get exam bank statistics
   * @returns {Promise<{total: number, byDifficulty: Object, byType: Object}>}
   */
  getExamBankStats: async () => {
    const res = await api.get('teacher/exam-bank/stats');
    return res.data;
  },

  /**
   * Remove question from exam bank
   * @param {string} questionId - The question ID to remove
   * @returns {Promise<void>}
   */
  removeFromExamBank: async (questionId) => {
    const res = await api.delete(`teacher/exam-bank/${questionId}`);
    return res.data;
  },

  // ==================== EXAMS ====================

  /**
   * Create a new exam
   * @param {Object} data - Exam data: title, examType, gradeId, subjectId, duration, instructions, schoolInfo
   * @returns {Promise<Object>} The created exam
   */
  createExam: async (data) => {
    const res = await api.post('teacher/exams', data);
    return res.data;
  },

  /**
   * List teacher's exams with optional filtering
   * @param {Object} params - Query params: page, limit, examType, status
   * @returns {Promise<{exams: Array, total: number, page: number, totalPages: number}>}
   */
  listExams: async (params = {}) => {
    const res = await api.get('teacher/exams', { params });
    return res.data;
  },

  /**
   * Get a single exam by ID
   * @param {string} examId - The exam ID
   * @returns {Promise<Object>} The exam details
   */
  getExam: async (examId) => {
    const res = await api.get(`teacher/exams/${examId}`);
    return res.data;
  },

  /**
   * Update exam details
   * @param {string} examId - The exam ID
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated exam
   */
  updateExam: async (examId, data) => {
    const res = await api.put(`teacher/exams/${examId}`, data);
    return res.data;
  },

  /**
   * Add questions to an exam from the exam bank
   * @param {string} examId - The exam ID
   * @param {string[]} questionIds - Array of question IDs to add
   * @param {number} defaultMarks - Default marks per question
   * @returns {Promise<Object>} Updated exam
   */
  addQuestionsToExam: async (examId, questionIds, defaultMarks = 1) => {
    const res = await api.post(`teacher/exams/${examId}/questions`, {
      questionIds,
      defaultMarks,
    });
    return res.data;
  },

  /**
   * Remove a question from an exam
   * @param {string} examId - The exam ID
   * @param {string} questionId - The question ID to remove
   * @returns {Promise<Object>} Updated exam
   */
  removeQuestionFromExam: async (examId, questionId) => {
    const res = await api.delete(`teacher/exams/${examId}/questions/${questionId}`);
    return res.data;
  },

  /**
   * Update marks for a question in an exam
   * @param {string} examId - The exam ID
   * @param {string} questionId - The question ID
   * @param {number} marks - New marks value
   * @returns {Promise<Object>} Updated exam
   */
  updateQuestionMarks: async (examId, questionId, marks) => {
    const res = await api.patch(`teacher/exams/${examId}/questions/${questionId}`, { marks });
    return res.data;
  },

  /**
   * Auto-build exam using blueprint criteria
   * @param {string} examId - The exam ID
   * @param {Object} blueprint - { totalQuestions, difficultyDistribution, typeDistribution, units, defaultMarks }
   * @returns {Promise<Object>} Updated exam with auto-selected questions
   */
  autoBuildExam: async (examId, blueprint) => {
    const res = await api.post(`teacher/exams/${examId}/auto-build`, blueprint);
    return res.data;
  },

  /**
   * Finalize an exam (prevents further editing)
   * @param {string} examId - The exam ID
   * @returns {Promise<Object>} Finalized exam
   */
  finalizeExam: async (examId) => {
    const res = await api.post(`teacher/exams/${examId}/finalize`);
    return res.data;
  },

  /**
   * Delete an exam
   * @param {string} examId - The exam ID
   * @returns {Promise<void>}
   */
  deleteExam: async (examId) => {
    const res = await api.delete(`teacher/exams/${examId}`);
    return res.data;
  },

  /**
   * Duplicate an exam
   * @param {string} examId - The exam ID to duplicate
   * @returns {Promise<Object>} The new duplicated exam
   */
  duplicateExam: async (examId) => {
    const res = await api.post(`teacher/exams/${examId}/duplicate`);
    return res.data;
  },
};
