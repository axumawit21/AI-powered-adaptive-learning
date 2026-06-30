/**
 * Application Constants
 * Centralized configuration values for the adaptive learning platform
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Auth Token Keys (localStorage)
export const TOKEN_KEYS = {
  ADMIN: 'adminToken',
  SCHOOL_ADMIN: 'schoolAdminToken',
  TEACHER: 'teacherToken',
  STUDENT: 'token',
};

// User Data Keys (localStorage)
export const USER_KEYS = {
  ADMIN: 'admin',
  SCHOOL_ADMIN: 'schoolAdmin',
  TEACHER: 'teacher',
  STUDENT: 'user',
};

// Route Prefixes
export const ROUTE_PREFIXES = {
  ADMIN: '/admin',
  SCHOOL_ADMIN: '/school-admin',
  TEACHER: '/teacher',
  STUDENT: '/',
};

// User Roles
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SCHOOL_ADMIN: 'school_admin',
  CONTENT_MODERATOR: 'content_moderator',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

// Cache Durations (milliseconds)
export const CACHE_DURATIONS = {
  ROLE_FEATURES: 5 * 60 * 1000, // 5 minutes
  USER_SESSION: 7 * 24 * 60 * 60 * 1000, // 7 days
};
