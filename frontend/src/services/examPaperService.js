import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  // Check for both student token and admin token
  const studentToken = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  const token = studentToken || adminToken;
  
  console.log('[examPaperService] Token check:', { 
    hasStudentToken: !!studentToken, 
    hasAdminToken: !!adminToken,
    usingToken: token ? token.substring(0, 20) + '...' : 'NONE'
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const examPaperService = {
  // Admin: Upload exam paper
  async uploadExamPaper(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('gradeId', metadata.gradeId);
    formData.append('subjectId', metadata.subjectId);
    formData.append('examYear', metadata.examYear.toString());

    const response = await API.post('/exam-paper/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Admin: List exam papers
  async listExamPapers(filters = {}) {
    const params = new URLSearchParams();
    if (filters.gradeId) params.append('gradeId', filters.gradeId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.examYear) params.append('examYear', filters.examYear.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await API.get(`/exam-paper?${params.toString()}`);
    return response.data;
  },

  // Admin: Get dashboard stats
  async getDashboardStats() {
    const response = await API.get('/exam-paper/stats');
    return response.data;
  },

  // Admin: Get exam paper by ID
  async getExamPaper(id) {
    const response = await API.get(`/exam-paper/${id}`);
    return response.data;
  },

  // Admin: Get questions for review
  async getQuestionsForReview(examPaperId, status = null) {
    const params = status ? `?status=${status}` : '';
    const response = await API.get(`/exam-paper/${examPaperId}/questions${params}`);
    return response.data;
  },

  // Admin: Update a question
  async updateQuestion(examPaperId, questionId, data) {
    const response = await API.patch(`/exam-paper/${examPaperId}/questions/${questionId}`, data);
    return response.data;
  },

  // Admin: Set question status (approve/reject)
  async setQuestionStatus(examPaperId, questionId, status, reviewerComment = null) {
    const payload = { status };
    if (reviewerComment) payload.reviewerComment = reviewerComment;
    const response = await API.post(`/exam-paper/${examPaperId}/questions/${questionId}/status`, payload);
    return response.data;
  },

  // Admin: Approve all questions
  async approveAllQuestions(examPaperId) {
    const response = await API.post(`/exam-paper/${examPaperId}/approve-all`);
    return response.data;
  },

  // Admin: Reprocess exam paper
  async reprocessExamPaper(examPaperId) {
    const response = await API.post(`/exam-paper/${examPaperId}/reprocess`);
    return response.data;
  },

  // Admin: Create manual question
  async createQuestion(examPaperId, data) {
    const response = await API.post(
      `/exam-paper/${examPaperId}/questions`,
      data
    );
    return response.data;
  },

  // Admin: Delete exam paper
  async deleteExamPaper(examPaperId) {
    const response = await API.delete(`/exam-paper/${examPaperId}`);
    return response.data;
  },

  // Student: Get approved exams
  async getApprovedExams(filters = {}) {
    const params = new URLSearchParams();
    if (filters.gradeId) params.append('gradeId', filters.gradeId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.examYear) params.append('examYear', filters.examYear.toString());

    const response = await API.get(`/exam-paper/approved/list?${params.toString()}`);
    return response.data;
  },

  // Student: Start exam session
  async startExamSession(examPaperId) {
    const response = await API.post(`/exam-paper/${examPaperId}/start`);
    return response.data;
  },

  // Admin: Upload and analyze question image with LLM Vision
  async analyzeQuestionImage(examPaperId, questionId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await API.post(
      `/exam-paper/${examPaperId}/questions/${questionId}/analyze-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Admin: Upload and analyze option image (A, B, C, or D) with LLM Vision
  async analyzeOptionImage(examPaperId, questionId, optionIndex, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await API.post(
      `/exam-paper/${examPaperId}/questions/${questionId}/analyze-option-image/${optionIndex}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
};

export default examPaperService;

