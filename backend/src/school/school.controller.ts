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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SchoolService } from './school.service';
import { TeacherUserService } from '../teacher/teacher-user.service';
import {
  CreateSchoolDto,
  UpdateSchoolDto,
  CreateSectionDto,
  CreateSectionBodyDto,
  UpdateSectionDto,
  CreateSchoolAdminDto,
  BulkImportStudentDto,
} from './dto/school.dto';

@ApiTags('Schools')
@Controller('schools')
@ApiBearerAuth()
export class SchoolController {
  constructor(
    private readonly schoolService: SchoolService,
    private readonly teacherUserService: TeacherUserService,
  ) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get('list')
  @ApiOperation({ summary: 'List all schools (Public - for registration forms)' })
  @ApiResponse({ status: 200, description: 'List of schools' })
  async listSchoolsPublic() {
    // Returns just basic school info for registration dropdown
    return this.schoolService.findAllSchools();
  }

  // ==================== SCHOOL ENDPOINTS (Super Admin only) ====================

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create a new school (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'School created successfully' })
  async createSchool(@Body() dto: CreateSchoolDto) {
    return this.schoolService.createSchool(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'List all schools (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'List of schools' })
  async listSchools() {
    return this.schoolService.findAllSchools();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get school by ID' })
  @ApiResponse({ status: 200, description: 'School details' })
  async getSchool(@Param('id') id: string) {
    return this.schoolService.findSchoolById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update school (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'School updated' })
  async updateSchool(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolService.updateSchool(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Delete school (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'School deleted' })
  async deleteSchool(@Param('id') id: string) {
    await this.schoolService.deleteSchool(id);
    return { success: true, message: 'School deleted' };
  }

  // ==================== SECTION ENDPOINTS ====================

  @Post(':schoolId/sections')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a section within a school' })
  @ApiResponse({ status: 201, description: 'Section created' })
  async createSection(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateSectionBodyDto,
  ) {
    return this.schoolService.createSection({ ...dto, schoolId });
  }

  @Get(':schoolId/sections')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List sections in a school' })
  @ApiResponse({ status: 200, description: 'List of sections' })
  async listSections(@Param('schoolId') schoolId: string) {
    return this.schoolService.findSectionsBySchool(schoolId);
  }

  @Put('sections/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a section' })
  async updateSection(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.schoolService.updateSection(id, dto);
  }

  @Delete('sections/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a section' })
  async deleteSection(@Param('id') id: string) {
    await this.schoolService.deleteSection(id);
    return { success: true, message: 'Section deleted' };
  }

  // ==================== BULK IMPORT ====================

  @Post(':schoolId/students/bulk-import')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bulk import students from JSON array' })
  @ApiBody({ type: [BulkImportStudentDto] })
  @ApiResponse({ status: 200, description: 'Import result' })
  async bulkImportStudents(
    @Param('schoolId') schoolId: string,
    @Body() students: BulkImportStudentDto[],
  ) {
    return this.schoolService.bulkImportStudents(schoolId, students);
  }

  @Post(':schoolId/students/bulk-import-csv')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk import students from CSV file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with columns: email, name, password (optional), sectionName (optional)',
        },
      },
    },
  })
  async bulkImportStudentsFromCsv(
    @Param('schoolId') schoolId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const csvContent = file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());
    
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have header and at least one data row');
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const emailIdx = header.indexOf('email');
    const nameIdx = header.indexOf('name');
    const passwordIdx = header.indexOf('password');
    const sectionIdx = header.indexOf('sectionname') !== -1 
      ? header.indexOf('sectionname') 
      : header.indexOf('section');

    if (emailIdx === -1 || nameIdx === -1) {
      throw new BadRequestException('CSV must have "email" and "name" columns');
    }

    // Parse data rows
    const students: BulkImportStudentDto[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < 2 || !cols[emailIdx]) continue;

      students.push({
        email: cols[emailIdx],
        name: cols[nameIdx],
        password: passwordIdx !== -1 ? cols[passwordIdx] : undefined,
        sectionName: sectionIdx !== -1 ? cols[sectionIdx] : undefined,
      });
    }

    return this.schoolService.bulkImportStudents(schoolId, students);
  }

  // ==================== ANALYTICS ====================

  @Get(':schoolId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get school statistics' })
  @ApiResponse({ status: 200, description: 'School statistics' })
  async getSchoolStats(@Param('schoolId') schoolId: string) {
    return this.schoolService.getSchoolStats(schoolId);
  }

  // ==================== TEACHERS ====================

  @Get(':schoolId/teachers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List teachers in a school' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of teachers with grade and subject' })
  async listTeachers(
    @Param('schoolId') schoolId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.teacherUserService.findBySchool(
      schoolId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Delete(':schoolId/teachers/:teacherId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a teacher from school' })
  @ApiResponse({ status: 200, description: 'Teacher removed' })
  async removeTeacher(@Param('teacherId') teacherId: string) {
    await this.teacherUserService.remove(teacherId);
    return { success: true, message: 'Teacher removed' };
  }
}
