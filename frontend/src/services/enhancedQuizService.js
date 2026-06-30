import api from './api';

export const enhancedQuizApi = {
  startQuiz: async (data) => {
    const res = await api.post('quiz/enhanced/start', data);
    return res.data;
  },
  submitAnswer: async (data) => {
    const res = await api.post('quiz/enhanced/answer', data);
    return res.data;
  },
  nextQuestion: async (sessionId) => {
    const res = await api.post(`quiz/enhanced/next/${sessionId}`);
    return res.data;
  },
  getStatus: async (sessionId) => {
    const res = await api.get(`quiz/enhanced/status/${sessionId}`);
    return res.data;
  },
  abandonQuiz: async (sessionId) => {
    const res = await api.delete(`quiz/enhanced/abandon/${sessionId}`);
    return res.data;
  }
};
