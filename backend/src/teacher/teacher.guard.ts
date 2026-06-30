import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Guard that ensures the user has the 'teacher' role
 */
@Injectable()
export class TeacherGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw new UnauthorizedException('Teacher access required');
    }

    return true;
  }
}
