import axios from 'axios';

// Set baseURL immediately (before any imports that might use axios)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Initialize axios with auth headers from localStorage based on current URL context
export function initAxios() {
  const path = window.location.pathname;
  let token = null;
  
  // Use route-aware token selection for complete role independence
  if (path.startsWith('/admin')) {
    // Admin routes use admin token
    token = localStorage.getItem('adminToken');
  } else if (path.startsWith('/school-admin')) {
    // School Admin routes use school admin token
    token = localStorage.getItem('schoolAdminToken');
  } else if (path.startsWith('/teacher')) {
    // Teacher routes use teacher token
    token = localStorage.getItem('teacherToken');
  } else {
    // All other routes (student/default) use student token
    token = localStorage.getItem('token');
  }
  
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // Clear auth header if no valid token for current context
    delete axios.defaults.headers.common['Authorization'];
  }
}

// Response interceptor for handling 401 errors (session expiry)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      
      // Don't redirect if already on a login page
      if (path.includes('/login')) {
        return Promise.reject(error);
      }
      
      // Clear appropriate tokens and redirect based on current route
      if (path.startsWith('/school-admin')) {
        localStorage.removeItem('schoolAdminToken');
        localStorage.removeItem('schoolAdmin');
        window.location.href = '/school-admin/login?expired=true';
      } else if (path.startsWith('/admin')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login?expired=true';
      } else if (path.startsWith('/teacher')) {
        localStorage.removeItem('teacherToken');
        localStorage.removeItem('teacher');
        window.location.href = '/teacher/login?expired=true';
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auto-init on module load for page refreshes
initAxios();

export default axios;
