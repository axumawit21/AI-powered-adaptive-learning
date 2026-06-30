import { Controller, Post, Get, Param, Body, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { SubjectDocument } from './subjects.schema';
import { CreateSubjectDto, UpdateSubjectDto, SubjectResponseDto } from './dto/subjects.dto';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /** ---------------- Create a new subject ---------------- */
  @Post()
  @ApiOperation({ summary: 'Create a new subject', description: 'Create a new subject' })
  @ApiBody({ type: CreateSubjectDto })
  @ApiResponse({ status: 201, description: 'Subject created successfully', type: SubjectResponseDto })
  @ApiResponse({ status: 400, description: 'Subject title already exists' })
  async createSubject(@Body() body: CreateSubjectDto): Promise<SubjectDocument> {
    return this.subjectsService.create(body);
  }

  /** ---------------- Get all subjects ---------------- */
  @Get()
  @ApiOperation({ summary: 'Get all subjects', description: 'Returns a list of all subjects' })
  @ApiResponse({ status: 200, description: 'List of subjects', type: [SubjectResponseDto] })
  async getAllSubjects(): Promise<SubjectDocument[]> {
    return this.subjectsService.findAll();
  }

  /** ---------------- Get a single subject by ID ---------------- */
  @Get(':id')
  @ApiOperation({ summary: 'Get subject by ID', description: 'Returns a single subject by its ID' })
  @ApiParam({ name: 'id', description: 'Subject MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Subject found', type: SubjectResponseDto })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async getSubjectById(@Param('id') id: string): Promise<SubjectDocument> {
    return this.subjectsService.findById(id);
  }

  /** ---------------- Update a subject ---------------- */
  @Put(':id')
  @ApiOperation({ summary: 'Update a subject', description: 'Update an existing subject' })
  @ApiParam({ name: 'id', description: 'Subject MongoDB ID' })
  @ApiBody({ type: UpdateSubjectDto })
  @ApiResponse({ status: 200, description: 'Subject updated', type: SubjectResponseDto })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async updateSubject(
    @Param('id') id: string,
    @Body() body: UpdateSubjectDto,
  ): Promise<SubjectDocument> {
    return this.subjectsService.update(id, body);
  }

  /** ---------------- Delete a subject ---------------- */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subject', description: 'Delete a subject by its ID' })
  @ApiParam({ name: 'id', description: 'Subject MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Subject deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async deleteSubject(@Param('id') id: string) {
    return this.subjectsService.delete(id);
  }
}

