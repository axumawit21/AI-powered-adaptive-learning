import api from './api';

export const questionBankApi = {
  // Generate questions using LLM
  generateQuestions: async (data) => {
    // data: GenerateQuestionsDto (subjectId, gradeId, unitNumber, etc.)
    const res = await api.post('question-bank/generate', data);
    return res.data;
  },

  // Get statistics
  getStats: async (params) => {
    const res = await api.get('question-bank/stats', { params });
    return res.data;
  },

  // Check available questions
  checkAvailable: async (data) => {
    const res = await api.post('question-bank/check-available', data);
    return res.data;
  },
  
  // Create single question
  createQuestion: async (data) => {
      const res = await api.post('question-bank/create', data);
      return res.data;
  },

  // Filter questions with pagination (Admin)
  filterQuestions: async (params) => {
    const res = await api.get('question-bank/filter', { params });
    return res.data;
  },

  // Ask AI about a quiz question
  askAI: async (data) => {
    const res = await api.post('question-bank/ask-ai', data);
    return res.data;
  }
};
