import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { GradeDocument } from './grades.schema';
import { CreateGradeDto, UpdateGradeDto, GradeResponseDto } from './dto/grades.dto';

@ApiTags('Grades')
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  /** ---------------- Create a new grade ---------------- */
  @Post()
  @ApiOperation({ summary: 'Create a new grade', description: 'Create a new grade level' })
  @ApiBody({ type: CreateGradeDto })
  @ApiResponse({ status: 201, description: 'Grade created successfully', type: GradeResponseDto })
  @ApiResponse({ status: 400, description: 'Grade number already exists' })
  async createGrade(@Body() body: CreateGradeDto): Promise<GradeDocument> {
    return this.gradesService.create(body);
  }

  /** ---------------- Get all grades ---------------- */
  @Get()
  @ApiOperation({ summary: 'Get all grades', description: 'Returns a list of all grade levels' })
  @ApiResponse({ status: 200, description: 'List of grades', type: [GradeResponseDto] })
  async getAllGrades(): Promise<GradeDocument[]> {
    return this.gradesService.findAll();
  }

  /** ---------------- Get a single grade by ID ---------------- */
  @Get(':id')
  @ApiOperation({ summary: 'Get grade by ID', description: 'Returns a single grade by its ID' })
  @ApiParam({ name: 'id', description: 'Grade MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Grade found', type: GradeResponseDto })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  async getGradeById(@Param('id') id: string): Promise<GradeDocument> {
    return this.gradesService.findById(id);
  }

  /** ---------------- Update a grade ---------------- */
  @Put(':id')
  @ApiOperation({ summary: 'Update a grade', description: 'Update an existing grade' })
  @ApiParam({ name: 'id', description: 'Grade MongoDB ID' })
  @ApiBody({ type: UpdateGradeDto })
  @ApiResponse({ status: 200, description: 'Grade updated', type: GradeResponseDto })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  async updateGrade(
    @Param('id') id: string,
    @Body() body: UpdateGradeDto,
  ): Promise<GradeDocument> {
    return this.gradesService.update(id, body);
  }

  /** ---------------- Delete a grade ---------------- */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a grade', description: 'Delete a grade by its ID' })
  @ApiParam({ name: 'id', description: 'Grade MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Grade deleted successfully' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  async deleteGrade(@Param('id') id: string) {
    return this.gradesService.delete(id);
  }
}

