
import { Controller, Request, Post, UseGuards, Body, Get, Patch, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto, RegisterDto, ChangePasswordDto, LoginResponseDto, ProfileResponseDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'General login (legacy)', description: 'Authenticate and receive a JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() req: LoginDto) {
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('student/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'Student login', description: 'Authenticate as a student and receive a JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied - not a student' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async studentLogin(@Body() req: LoginDto) {
    const user = await this.authService.validateUserByRole(req.email, req.password, 'student');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.role !== 'student') {
      throw new ForbiddenException('Access denied. This portal is for students only. Please use the teacher login.');
    }
    return this.authService.login(user);
  }

  @Post('teacher/login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'Teacher login', description: 'Authenticate as a teacher and receive a JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied - not a teacher' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async teacherLogin(@Body() req: LoginDto) {
    const user = await this.authService.validateUserByRole(req.email, req.password, 'teacher');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.role !== 'teacher' && user.role !== 'admin') {
      throw new ForbiddenException('Access denied. This portal is for teachers only. Please use the student login.');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user', description: 'Create a new student or teacher account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Email already exists' })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('teacher/register')
  @ApiOperation({ summary: 'Register new teacher', description: 'Create a new teacher account with optional grade/subject' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Teacher' },
        email: { type: 'string', example: 'teacher@example.com' },
        password: { type: 'string', example: 'password123' },
        gradeId: { type: 'string', description: 'Optional Grade ObjectId' },
        subjectId: { type: 'string', description: 'Optional Subject ObjectId' },
        schoolId: { type: 'string', description: 'Optional School ObjectId' },
      },
      required: ['name', 'email', 'password'],
    },
  })
  @ApiResponse({ status: 201, description: 'Teacher registered successfully' })
  @ApiResponse({ status: 400, description: 'Email already exists' })
  async teacherRegister(@Body() body: any) {
    return this.authService.registerTeacher(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile', description: 'Returns the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved', type: ProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password', description: 'Change the authenticated user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or current password incorrect' })
  async changePassword(@Request() req, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword, req.user.role);
  }
}

