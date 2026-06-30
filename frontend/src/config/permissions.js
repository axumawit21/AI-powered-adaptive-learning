
// Feature Registry - Single source of truth for all features
export const FEATURES = {
  // --- Core Features ---
  dashboard: { 
    id: 'dashboard',
    label: 'Dashboard', 
    icon: 'layout-dashboard', // We will map these strings to icons in the component
    route: '/admin', 
    permission: 'dashboard.view' 
  },
  
  // --- Academic Management ---
  grades: { 
    id: 'grades',
    label: 'Grades', 
    icon: 'graduation-cap', 
    route: '/admin/grades', 
    permission: 'grades.view' 
  },
  subjects: { 
    id: 'subjects',
    label: 'Subjects', 
    icon: 'book-open', 
    route: '/admin/subjects', 
    permission: 'subjects.view' 
  },
  books: { 
    id: 'books',
    label: 'Books', 
    icon: 'book', 
    route: '/admin/books', 
    permission: 'books.view' 
  },
  units: { 
    id: 'units',
    label: 'Units', 
    icon: 'layers', 
    route: '/admin/units', 
    permission: 'units.view' 
  },

  // --- User Management ---
  students: { 
    id: 'students',
    label: 'Students', 
    icon: 'users', 
    route: '/admin/students', 
    permission: 'students.view' 
  },
  teachers: { 
    id: 'teachers',
    label: 'Teachers', 
    icon: 'user-check', 
    route: '/admin/teachers', 
    permission: 'teachers.view' // New unified permission
  },
  schools: {
    id: 'schools',
    label: 'Schools',
    icon: 'building',
    route: '/admin/schools',
    permission: 'schools.manage' // Super admin only
  },

  // --- Content & Exams ---
  questionBank: { 
    id: 'questionBank',
    label: 'Question Bank', 
    icon: 'database', 
    route: '/admin/question-bank', 
    permission: 'questions.view' 
  },
  contentModeration: { 
    id: 'contentModeration',
    label: 'Moderation', 
    icon: 'shield-check', 
    route: '/admin/content-moderation', 
    permission: 'content.moderate' 
  },
  examPapers: { 
    id: 'examPapers',
    label: 'Exam Papers', 
    icon: 'file-text', 
    route: '/admin/exam-papers', 
    permission: 'exams.view' 
  },
  modelExams: { 
    id: 'modelExams',
    label: 'Model Exams', 
    icon: 'award', 
    route: '/admin/model-exams', 
    permission: 'modelexams.view' 
  },

  // NOTE: School Admin features are handled separately in SCHOOL_ADMIN_FEATURES
  // to prevent them appearing in Super Admin sidebar
}; 

// School Admin specific features (separate to avoid showing in super admin)
export const SCHOOL_ADMIN_FEATURES = {
  schoolDashboard: {
    id: 'schoolDashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    route: '/school-admin',
    permission: 'school.dashboard'
  },
  schoolStudents: {
    id: 'schoolStudents',
    label: 'Students',
    icon: 'users',
    route: '/school-admin/students',
    permission: 'school.students'
  },
  sections: {
    id: 'sections',
    label: 'Sections',
    icon: 'grid',
    route: '/school-admin/sections',
    permission: 'sections.view'
  },
  schoolTeachers: {
    id: 'schoolTeachers',
    label: 'Teachers',
    icon: 'user-check',
    route: '/school-admin/teachers',
    permission: 'school.teachers'
  }
  // Note: Bulk Import is now integrated into Sections view
};

// Teacher specific features
export const TEACHER_FEATURES = {
  teacherDashboard: {
    id: 'teacherDashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    route: '/teacher',
    permission: 'dashboard.view'
  },
  createQuestion: {
    id: 'createQuestion',
    label: 'Create Question',
    icon: 'file-text',
    route: '/teacher/create',
    permission: 'questions.create'
  },
  examBank: {
    id: 'examBank',
    label: 'Exam Bank',
    icon: 'database',
    route: '/teacher/exam-bank',
    permission: 'exams.create'
  },
  myExams: {
    id: 'myExams',
    label: 'My Exams',
    icon: 'file-text',
    route: '/teacher/exams',
    permission: 'exams.create'
  },
  contentApprovals: {
    id: 'contentApprovals',
    label: 'Content Approvals',
    icon: 'shield-check',
    route: '/teacher/approvals',
    permission: 'dashboard.view'
  },
  drafts: {
    id: 'drafts',
    label: 'Drafts',
    icon: 'book',
    route: '/teacher/drafts',
    permission: 'questions.view'
  },
  submissions: {
    id: 'submissions',
    label: 'Submissions',
    icon: 'layers',
    route: '/teacher/submitted',
    permission: 'questions.view'
  }
};

// Default Permissions per Role
// These serve as the BASE. Database overrides will add/remove from these.
export const ROLE_DEFAULTS = {
  // Super Admin gets everything via wildcard logic in composable, but explicit list helps too
  super_admin: ['*'],
  
  // Legacy admin role - treat same as super_admin
  admin: ['*'],

  // School Admin - Only essential school management features
  // To add a feature later: just add the permission here (e.g., 'teachers.view')
  school_admin: [
    'school.dashboard',    // School admin dashboard
    'school.students',     // School students view  
    'sections.view',       // Manage sections (includes bulk import)
    'school.teachers',     // School teachers view
  ],

  // Content Moderator
  content_moderator: [
    'dashboard.view',
    'content.moderate',
    'questions.view',
    'questions.edit', // Can edit pending questions
  ],
  
  // Teacher (if they access admin panel features)
  teacher: [
    'dashboard.view',
    'questions.create',
    'questions.view', // Own questions
    'exams.create'
  ]
};

// ============ HELPER FUNCTIONS ============

/**
 * Check if a user has a specific permission
 * @param {string[]} userPermissions - Array of user's permissions
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(userPermissions, requiredPermission) {
  if (!userPermissions || !requiredPermission) return false;
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(requiredPermission);
}

/**
 * Get all features a user can access based on their permissions and role
 * @param {string[]} userPermissions - Array of user's permissions
 * @param {string} userRole - Optional role to determine feature set
 * @returns {Object[]} Array of feature objects
 */
export function getAllowedFeatures(userPermissions, userRole = null) {
  if (!userPermissions) return [];
  
  // School admin uses special feature set
  if (userRole === 'school_admin') {
    return Object.values(SCHOOL_ADMIN_FEATURES).filter(feature => 
      userPermissions.includes(feature.permission)
    );
  }
  
  // Teacher uses teacher-specific feature set
  if (userRole === 'teacher') {
    return Object.values(TEACHER_FEATURES).filter(feature => 
      userPermissions.includes(feature.permission)
    );
  }
  
  // Super admin / admin uses main FEATURES (excludes school-admin specific)
  if (userPermissions.includes('*')) {
    return Object.values(FEATURES);
  }
  
  return Object.values(FEATURES).filter(feature => 
    userPermissions.includes(feature.permission)
  );
}

/**
 * Get default permissions for a role
 * @param {string} role - Role name
 * @returns {string[]} Array of permission strings
 */
export function getDefaultPermissions(role) {
  return ROLE_DEFAULTS[role] || [];
}

/**
 * Merge base permissions with custom overrides
 * Supports '+permission' to add, '-permission' to remove
 * @param {string} role - Base role
 * @param {string[]} overrides - Custom overrides
 * @returns {string[]} Final permissions array
 */
export function mergePermissions(role, overrides = []) {
  const base = [...getDefaultPermissions(role)];
  
  // If base has wildcard, return it (can't add to everything)
  if (base.includes('*')) return base;
  
  for (const override of overrides) {
    if (override.startsWith('-')) {
      // Remove permission
      const perm = override.slice(1);
      const idx = base.indexOf(perm);
      if (idx > -1) base.splice(idx, 1);
    } else if (override.startsWith('+')) {
      // Add permission
      const perm = override.slice(1);
      if (!base.includes(perm)) base.push(perm);
    } else {
      // Direct add
      if (!base.includes(override)) base.push(override);
    }
  }
  
  return base;
}

// ============ DYNAMIC FEATURE MANAGEMENT ============

const CACHE_KEY = 'roleFeatures';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch role features from backend API
 * @param {string} role - Role to fetch features for
 * @param {string} token - Admin JWT token for authorization
 * @returns {Promise<{features: string[], permissions: string[]}>}
 */
export async function fetchRoleFeatures(role, token) {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/role-features/${role}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`[permissions] Failed to fetch role features for ${role}:`, response.status);
      return null;
    }
    
    const result = await response.json();
    if (result.ok && result.data) {
      // Cache the result
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cached[role] = {
        data: result.data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      
      return result.data;
    }
    return null;
  } catch (error) {
    console.warn(`[permissions] Error fetching role features:`, error);
    return null;
  }
}

/**
 * Get cached role features or fetch from API
 * Falls back to ROLE_DEFAULTS if API unavailable
 * @param {string} role - Role to get features for
 * @param {string} token - Optional token for API call
 * @returns {Promise<string[]>} Array of permissions
 */
export async function getRolePermissions(role, token = null) {
  // Check cache first
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  const roleCache = cached[role];
  
  if (roleCache && (Date.now() - roleCache.timestamp < CACHE_DURATION)) {
    return roleCache.data.permissions || [];
  }
  
  // Try to fetch from API if token is available
  if (token) {
    const fetched = await fetchRoleFeatures(role, token);
    if (fetched) {
      return fetched.permissions || [];
    }
  }
  
  // Fall back to defaults
  return getDefaultPermissions(role);
}

/**
 * Clear cached role features
 */
export function clearRoleFeaturesCache() {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Get features for a role (async version with API support)
 * @param {string} role - Role to get features for
 * @param {string} token - Optional token for API call
 * @returns {Promise<Object[]>} Array of feature objects
 */
export async function getDynamicFeatures(role, token = null) {
  const permissions = await getRolePermissions(role, token);
  return getAllowedFeatures(permissions, role);
}

