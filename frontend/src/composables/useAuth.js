
import { ref } from 'vue';
import axios from '@/services/api.js';

const user = ref(JSON.parse(localStorage.getItem('user')) || null);
const token = ref(localStorage.getItem('token') || null);

if (token.value) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
}

export function useAuth() {
  /**
   * Login for students - uses student-specific endpoint
   */
  async function login(email, password) {
    try {
      const res = await axios.post('auth/student/login', { email, password });
      const data = res.data;
      
      token.value = data.access_token;
      user.value = data.user;
      
      // Store student token (no clearing of other role tokens - they coexist)
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      return user.value;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  }

  async function register(name, email, password, role = 'student', gradeNumber = null) {
    try {
      const payload = { name, email, password, role };
      if (gradeNumber) payload.gradeNumber = gradeNumber;
      
      const res = await axios.post('auth/register', payload);
      const data = res.data;
      
      token.value = data.access_token;
      user.value = data.user;
      
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      return user.value;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }

  return {
    user,
    token,
    login,
    register,
    logout
  };
}
