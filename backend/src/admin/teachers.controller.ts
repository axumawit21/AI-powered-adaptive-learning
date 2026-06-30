import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TeacherUserService } from '../teacher/teacher-user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('Teachers (Admin)')
@Controller('teachers')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class TeachersController {
  constructor(private readonly teacherUserService: TeacherUserService) {}

  /** ---------------- Get all teachers with pagination ---------------- */
  @Get()
  @ApiOperation({ summary: 'Get all teachers', description: 'Returns a paginated list of all registered teachers' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50, max: 100)' })
  @ApiResponse({ status: 200, description: 'Paginated list of teachers' })
  async getAllTeachers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    // Enforce maximum limit to prevent abuse
    const safeLimit = Math.min(limit || 50, 100);
    const safePage = Math.max(page || 1, 1);
    return this.teacherUserService.findAll(safePage, safeLimit);
  }

  /** ---------------- Get a single teacher by ID ---------------- */
  @Get(':id')
  @ApiOperation({ summary: 'Get teacher by ID', description: 'Returns a single teacher by their ID' })
  @ApiParam({ name: 'id', description: 'Teacher MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Teacher found' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async getTeacherById(@Param('id') id: string) {
    return this.teacherUserService.findOneOrFail(id);
  }

  /** ---------------- Delete a teacher ---------------- */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a teacher', description: 'Delete a teacher by their ID' })
  @ApiParam({ name: 'id', description: 'Teacher MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Teacher deleted successfully' })
  @ApiResponse({ status: 404, description: 'Teacher not found' })
  async deleteTeacher(@Param('id') id: string) {
    return this.teacherUserService.remove(id);
  }
}
