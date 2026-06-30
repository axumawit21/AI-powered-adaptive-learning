import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Wrapper around Passport's JWT authentication guard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
