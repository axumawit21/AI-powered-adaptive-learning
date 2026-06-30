import { computed } from 'vue';
import { ROLE_DEFAULTS } from '../config/permissions';

export function usePermissions() {
  
  // Get user from local storage based on current route context
  const getUser = () => {
    // Detect which dashboard context we're in based on URL path
    const currentPath = window.location.pathname;
    
    // If on /admin routes, prioritize admin user (super_admin)
    if (currentPath.startsWith('/admin')) {
      const admin = localStorage.getItem('admin');
      if (admin) return JSON.parse(admin);
    }
    
    // If on /school-admin routes, prioritize school admin user
    if (currentPath.startsWith('/school-admin')) {
      const schoolAdmin = localStorage.getItem('schoolAdmin');
      if (schoolAdmin) return JSON.parse(schoolAdmin);
    }
    
    // Fallback: check all user types in order
    const schoolAdmin = localStorage.getItem('schoolAdmin');
    if (schoolAdmin) return JSON.parse(schoolAdmin);

    const admin = localStorage.getItem('admin');
    if (admin) return JSON.parse(admin);

    const teacher = localStorage.getItem('teacher');
    if (teacher) return JSON.parse(teacher);

    return null;
  };

  const user = getUser();
  const userRole = user?.role || 'guest';

  // Calculate final permissions
  const permissions = computed(() => {
    if (!user) return [];

    // 1. Start with Role Defaults
    // Use the role from DB, mapped to our defaults. 
    // Fallback to empty array if role unknown.
    let perms = ROLE_DEFAULTS[userRole] || [];

    // 2. Apply Database Overrides (if exists)
    // The backend Admin schema will have a 'permissions' array
    // which can include "+perm" (grant) or "-perm" (revoke)
    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach(p => {
        if (p.startsWith('-')) {
          // Revoke permission
          const toRemove = p.substring(1);
          perms = perms.filter(existing => existing !== toRemove);
        } else if (p.startsWith('+')) {
          // Grant permission
          perms.push(p.substring(1));
        } else {
          // Direct grant
          perms.push(p);
        }
      });
    }

    return [...new Set(perms)]; // Unique values
  });

  // Main check function
  const hasPermission = (requiredPermission) => {
    if (!user) return false;

    // Super Admin Wildcard check (if role is super_admin OR has '*' permission)
    if (userRole === 'super_admin' || permissions.value.includes('*')) {
      return true;
    }

    return permissions.value.includes(requiredPermission);
  };

  // Check multiple (some)
  const hasAnyPermission = (permissionList) => {
    return permissionList.some(p => hasPermission(p));
  };

  // Check multiple (all)
  const hasAllPermissions = (permissionList) => {
    return permissionList.every(p => hasPermission(p));
  };

  return {
    user,
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}
