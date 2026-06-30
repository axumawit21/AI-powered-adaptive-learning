import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { AdminLoginDto, AdminRegisterDto, AdminLoginResponseDto, AdminResponseDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/admin.guard';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'Admin login', description: 'Authenticate as an admin and receive a JWT token' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: AdminLoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() body: AdminLoginDto) {
    const admin = await this.adminService.validateAdmin(body.email, body.password);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.adminService.login(admin);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register new admin (Super Admin only)', description: 'Create a new admin account - requires super admin authentication' })
  @ApiBody({ type: AdminRegisterDto })
  @ApiResponse({ status: 201, description: 'Admin registered successfully', type: AdminResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - not authenticated' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a super admin' })
  @ApiResponse({ status: 400, description: 'Email already exists' })
  async register(@Body() body: AdminRegisterDto) {
    return this.adminService.register(body);
  }
}
