import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';

/**
 * Guard that ensures the user has an admin-level role
 * Accepts: admin, super_admin, content_moderator
 * Use after JwtAuthGuard to protect admin-only routes
 */
@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminRoles = ['admin', 'super_admin', 'content_moderator'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (!this.adminRoles.includes(user.role)) {
      throw new UnauthorizedException('Admin access required');
    }

    return true;
  }
}

/**
 * Guard that ensures the user has super_admin or admin role (full platform access)
 * Use for platform-wide management: creating admins, managing all schools, etc.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  private readonly superAdminRoles = ['super_admin', 'admin'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (!this.superAdminRoles.includes(user.role)) {
      throw new ForbiddenException('Super admin access required');
    }

    return true;
  }
}

/**
 * Guard that ensures the user has school_admin role
 * Use for school-specific management: sections, students within a school
 */
@Injectable()
export class SchoolAdminGuard implements CanActivate {
  private readonly allowedRoles = ['school_admin', 'super_admin', 'admin'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (!this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException('School admin access required');
    }

    return true;
  }
}

/**
 * Guard that ensures the user has content_moderator role or higher
 * Use for content moderation: approving/rejecting teacher questions
 */
@Injectable()
export class ContentModeratorGuard implements CanActivate {
  private readonly allowedRoles = ['content_moderator', 'super_admin', 'admin'];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (!this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Content moderator access required');
    }

    return true;
  }
}

