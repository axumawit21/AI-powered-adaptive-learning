import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const progressService = {
  async getDashboardOverview() {
    const { data } = await axios.get(`${API_URL}/progress/dashboard`, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async getGlobalHistory(days = 7) {
    const { data } = await axios.get(`${API_URL}/progress/history?days=${days}`, {
        headers: getAuthHeaders()
    });
    return data;
  },

  async getSubjectProgress(subjectId) {
    const { data } = await axios.get(`${API_URL}/progress/subject/${subjectId}`, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async getWeeklyProgress(bookId) {
    const { data } = await axios.get(`${API_URL}/progress/weekly/${bookId}`, {
        headers: getAuthHeaders()
    });
    return data;
  },

  async getMonthlyProgress(bookId) {
    const { data } = await axios.get(`${API_URL}/progress/monthly/${bookId}`, {
        headers: getAuthHeaders()
    });
    return data;
  },

  async getActivityStats(type, timeframe) {
    const { data } = await axios.get(`${API_URL}/progress/activity-stats`, {
      params: { type, timeframe },
      headers: getAuthHeaders()
    });
    return data;
  }
};
