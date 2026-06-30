import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const studentToken = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  
  // Use adminToken for admin endpoints, studentToken for student endpoints
  // Student endpoints: /model-exams (without /admin prefix)
  // Admin endpoints: /admin/model-exams
  const isAdminEndpoint = config.url?.startsWith('/admin');
  const token = isAdminEndpoint ? (adminToken || studentToken) : (studentToken || adminToken);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================
// Pattern Analysis
// ============================================================

export const analyzePatterns = async (subjectId, selectedYears) => {
  const response = await API.post('/admin/model-exams/analyze', {
    subjectId,
    selectedYears,
  });
  return response.data;
};

export const getPatternsBySubject = async (subjectId) => {
  const response = await API.get(`/admin/model-exams/patterns/${subjectId}`);
  return response.data;
};

export const getAvailableYears = async (subjectId) => {
  const response = await API.get(`/admin/model-exams/available-years/${subjectId}`);
  return response.data;
};

export const getSubjectsWithPapers = async () => {
  const response = await API.get('/admin/model-exams/subjects-with-papers');
  return response.data;
};

// ============================================================
// Blueprint
// ============================================================

export const generateBlueprint = async (patternId, totalQuestions, duration, title) => {
  const response = await API.post('/admin/model-exams/blueprint', {
    patternId,
    totalQuestions,
    duration,
    title,
  });
  return response.data;
};

export const createDefaultBlueprint = async (subjectId, totalQuestions, duration) => {
  const response = await API.post('/admin/model-exams/blueprint/default', null, {
    params: { subjectId, totalQuestions, duration },
  });
  return response.data;
};

// ============================================================
// Model Exam CRUD
// ============================================================

export const createModelExam = async (data) => {
  const response = await API.post('/admin/model-exams', data);
  return response.data;
};

export const listModelExams = async (filters = {}) => {
  const response = await API.get('/admin/model-exams', { params: filters });
  return response.data;
};

export const getModelExamById = async (id) => {
  const response = await API.get(`/admin/model-exams/${id}`);
  return response.data;
};

export const generateQuestions = async (modelExamId, regenerate = false) => {
  const response = await API.post('/admin/model-exams/generate-questions', {
    modelExamId,
    regenerate,
  });
  return response.data;
};

export const publishModelExam = async (id) => {
  const response = await API.patch(`/admin/model-exams/${id}/publish`);
  return response.data;
};

export const unpublishModelExam = async (id) => {
  const response = await API.patch(`/admin/model-exams/${id}/unpublish`);
  return response.data;
};

export const archiveModelExam = async (id) => {
  const response = await API.patch(`/admin/model-exams/${id}/archive`);
  return response.data;
};

export const deleteModelExam = async (id) => {
  const response = await API.delete(`/admin/model-exams/${id}`);
  return response.data;
};

// ============================================================
// Student Endpoints
// ============================================================

export const getPublishedExams = async (subjectId = null) => {
  const params = subjectId ? { subjectId } : {};
  const response = await API.get('/model-exams', { params });
  return response.data;
};

export const startModelExam = async (examId) => {
  const response = await API.post(`/model-exams/${examId}/start`);
  return response.data;
};
