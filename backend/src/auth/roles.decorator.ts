import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator for role-based access control
 * Usage: @Roles('admin', 'teacher')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
