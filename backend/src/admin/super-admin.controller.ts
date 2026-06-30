import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/admin.guard';

// DTOs
class CreateAdminDto {
  name: string;
  email: string;
  password: string;
  role?: 'super_admin' | 'admin' | 'content_moderator' | 'school_admin';
  schoolId?: string;
}

class UpdateAdminDto {
  name?: string;
  email?: string;
  role?: string;
  schoolId?: string;
}

@ApiTags('Super Admin')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class SuperAdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get super admin dashboard stats', description: 'Platform-wide statistics (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async getDashboard() {
    // Use aggregation instead of loading all admin documents
    const stats = await this.adminService.getDashboardStats();
    return {
      ok: true,
      data: {
        totalAdmins: stats.totalAdmins,
        adminsByRole: stats.adminsByRole,
      },
    };
  }

  // ==================== ADMIN MANAGEMENT ====================

  @Get('admins')
  @ApiOperation({ summary: 'List all admins', description: 'Get all admin users (Super Admin only)' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiResponse({ status: 200, description: 'List of admins' })
  async listAdmins(@Query('role') role?: string) {
    // Use role-specific query when filtering, cached findAll otherwise
    const admins = role 
      ? await this.adminService.findByRole(role)
      : await this.adminService.findAll();
    
    return { ok: true, data: admins };
  }

  @Post('admins')
  @ApiOperation({ summary: 'Create a new admin', description: 'Create admin with specific role (Super Admin only)' })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({ status: 201, description: 'Admin created' })
  async createAdmin(@Body() dto: CreateAdminDto) {
    const result = await this.adminService.register({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role || 'admin',
      schoolId: dto.schoolId,
    });
    
    return { 
      ok: true, 
      data: result.admin, 
      message: `Admin '${dto.name}' created with role: ${dto.role || 'admin'}` 
    };
  }

  @Get('admins/:id')
  @ApiOperation({ summary: 'Get admin by ID' })
  @ApiResponse({ status: 200, description: 'Admin details' })
  async getAdmin(@Param('id') id: string) {
    // Use findById instead of loading all admins and filtering in-memory
    const admin = await this.adminService.findById(id);
    
    if (!admin) {
      return { ok: false, message: 'Admin not found' };
    }
    
    return { ok: true, data: admin };
  }

  // ==================== PLATFORM OVERVIEW ====================

  @Get('overview')
  @ApiOperation({ summary: 'Get platform overview', description: 'High-level platform metrics' })
  @ApiResponse({ status: 200, description: 'Platform overview' })
  async getPlatformOverview() {
    // Use countDocuments instead of loading all admin documents
    const adminCount = await this.adminService.getAdminCount();
    
    return {
      ok: true,
      data: {
        platform: {
          name: 'Adaptive Learning Platform',
          version: '1.0.0',
        },
        admins: adminCount,
        roles: ['super_admin', 'admin', 'school_admin', 'content_moderator', 'teacher', 'student'],
      },
    };
  }
}
