import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const gamificationService = {
  async getStats() {
    const { data } = await axios.get(`${API_URL}/gamification/stats`, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async getAchievements() {
    const { data } = await axios.get(`${API_URL}/gamification/achievements`, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async getAllAchievements() {
    const { data } = await axios.get(`${API_URL}/gamification/achievements/all`, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async getLeaderboard(limit = 10) {
    const { data } = await axios.get(`${API_URL}/gamification/leaderboard?limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async recordActivity(type, activityData = {}) {
    const { data } = await axios.post(
      `${API_URL}/gamification/activity`,
      { type, data: activityData },
      { headers: getAuthHeaders() }
    );
    return data;
  },

  // Goals
  async createGoal(goalData) {
    const { data } = await axios.post(
      `${API_URL}/gamification/goals`,
      goalData,
      { headers: getAuthHeaders() }
    );
    return data;
  },

  async getGoals(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const { data } = await axios.get(
      `${API_URL}/gamification/goals?${params}`,
      { headers: getAuthHeaders() }
    );
    return data;
  },

  async getGoalSuggestions() {
    const { data} = await axios.get(`${API_URL}/gamification/goals/suggestions`, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async getGoalProgress() {
    const { data } = await axios.get(`${API_URL}/gamification/goals/progress`, {
      headers: getAuthHeaders()
    });
    return data;
  },

  async updateGoalProgress(goalId, increment) {
    const { data } = await axios.post(
      `${API_URL}/gamification/goals/${goalId}/progress`,
      { increment },
      { headers: getAuthHeaders() }
    );
    return data;
  },

  async updateGoal(goalId, updates) {
    const { data } = await axios.post(
      `${API_URL}/gamification/goals/${goalId}`,
      updates,
      { headers: getAuthHeaders() }
    );
    return data;
  },

  async deleteGoal(goalId) {
    const { data } = await axios.post(
      `${API_URL}/gamification/goals/${goalId}/delete`,
      {},
      { headers: getAuthHeaders() }
    );
    return data;
  }
};
