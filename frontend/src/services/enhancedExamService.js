import api from './api';

export const enhancedExamApi = {
  generateExam: async (data) => {
    // data: { subjectId, gradeId, type, unitNumber, unitTitle, questionCount, difficulty }
    const res = await api.post('exam/enhanced/generate', data);
    return res.data;
  },
  submitExam: async (data) => {
    // data: { examId, answers: [{ questionIndex, answer }] }
    const res = await api.post('exam/enhanced/submit', data);
    return res.data;
  },
  getResults: async (examId) => {
    const res = await api.get(`exam/enhanced/results/${examId}`);
    return res.data;
  },
  getHistory: async (subjectId) => {
    const params = subjectId ? { subjectId } : {};
    const res = await api.get('exam/enhanced/history', { params });
    return res.data;
  }
};
