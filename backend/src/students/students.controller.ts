import { Controller, Get, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { StudentResponseDto } from './dto/students.dto';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /** ---------------- Get all students with pagination ---------------- */
  @Get()
  @ApiOperation({ summary: 'Get all students', description: 'Returns a paginated list of all registered students' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50, max: 100)' })
  @ApiResponse({ status: 200, description: 'Paginated list of students' })
  async getAllStudents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    // Enforce maximum limit to prevent abuse
    const safeLimit = Math.min(limit || 50, 100);
    const safePage = Math.max(page || 1, 1);
    return this.studentsService.findAll(safePage, safeLimit);
  }

  /** ---------------- Get a single student by ID ---------------- */
  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID', description: 'Returns a single student by their ID' })
  @ApiParam({ name: 'id', description: 'Student MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Student found', type: StudentResponseDto })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async getStudentById(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  /** ---------------- Delete a student ---------------- */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student', description: 'Delete a student by their ID' })
  @ApiParam({ name: 'id', description: 'Student MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async deleteStudent(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}