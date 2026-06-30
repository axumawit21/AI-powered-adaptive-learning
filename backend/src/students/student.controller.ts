import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { StudentsService } from './students.service';
import { AuthGuard } from '@nestjs/passport';

// DTO for profile update
class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;
}

// DTO for API key update
class UpdateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  geminiApiKey: string;
}

/**
 * Student-facing controller for student-specific endpoints
 * All endpoints require student/teacher JWT authentication
 */
@ApiTags('Student')
@Controller('student')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class StudentController {
  constructor(private readonly studentsService: StudentsService) {}

  // ==================== PROFILE ====================

  @Get('profile')
  @ApiOperation({ summary: 'Get current student profile', description: 'Returns the authenticated student\'s profile' })
  @ApiResponse({ status: 200, description: 'Student profile' })
  async getProfile(@Request() req) {
    const studentId = req.user.userId;
    const student = await this.studentsService.findOne(studentId);
    
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    
    return {
      ok: true,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role || 'student',
        studentId: student.studentId,
        schoolId: student.schoolId,
        sectionId: student.sectionId,
        hasApiKey: !!student.geminiApiKey,
      },
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update student profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const studentId = req.user.userId;
    const updated = await this.studentsService.updateProfile(studentId, dto);
    
    return {
      ok: true,
      data: updated,
      message: 'Profile updated successfully',
    };
  }

  // ==================== API KEY (BYOK) ====================

  @Patch('api-key')
  @ApiOperation({ summary: 'Save or update personal Gemini API key' })
  @ApiBody({ type: UpdateApiKeyDto })
  @ApiResponse({ status: 200, description: 'API key saved' })
  async updateApiKey(@Request() req, @Body() dto: UpdateApiKeyDto) {
    const studentId = req.user.userId;
    await this.studentsService.updateApiKey(studentId, dto.geminiApiKey);
    return { ok: true, message: 'API key saved successfully' };
  }

  @Delete('api-key')
  @ApiOperation({ summary: 'Remove personal Gemini API key' })
  @ApiResponse({ status: 200, description: 'API key removed' })
  async removeApiKey(@Request() req) {
    const studentId = req.user.userId;
    await this.studentsService.updateApiKey(studentId, null);
    return { ok: true, message: 'API key removed' };
  }

  @Get('api-key/status')
  @ApiOperation({ summary: 'Check if student has a personal API key' })
  @ApiResponse({ status: 200, description: 'API key status' })
  async getApiKeyStatus(@Request() req) {
    const studentId = req.user.userId;
    const student = await this.studentsService.findOne(studentId);
    return { ok: true, hasApiKey: !!student?.geminiApiKey };
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get student dashboard data', description: 'Aggregated dashboard data for the student' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(@Request() req) {
    const studentId = req.user.userId;
    const student = await this.studentsService.findOne(studentId);
    
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    
    return {
      ok: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          studentId: student.studentId,
        },
        // Other dashboard data can be added here
      },
    };
  }

  // ==================== SETTINGS ====================

  @Get('settings')
  @ApiOperation({ summary: 'Get student settings' })
  @ApiResponse({ status: 200, description: 'Student settings' })
  async getSettings(@Request() req) {
    return {
      ok: true,
      data: {
        notifications: true, // Placeholder - can be stored in DB
        theme: 'light',
        language: 'en',
      },
    };
  }
}
