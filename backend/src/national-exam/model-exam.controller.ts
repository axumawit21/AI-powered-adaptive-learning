import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatternAnalysisService } from './services/pattern-analysis.service';
import { BlueprintService } from './services/blueprint.service';
import { ModelExamService } from './services/model-exam.service';
import {
  AnalyzeExamPatternsDto,
  GenerateBlueprintDto,
  CreateModelExamDto,
  GenerateModelExamQuestionsDto,
  PublishModelExamDto,
} from './dto/model-exam.dto';

/**
 * Admin endpoints for model exam management.
 * Students cannot access these endpoints.
 */
@ApiTags('Admin - Model Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/model-exams')
export class ModelExamAdminController {
  constructor(
    private readonly patternService: PatternAnalysisService,
    private readonly blueprintService: BlueprintService,
    private readonly modelExamService: ModelExamService,
  ) {}

  // ============================================================
  // Pattern Analysis Endpoints
  // ============================================================

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze patterns from selected entrance exam years' })
  async analyzePatterns(@Body() dto: AnalyzeExamPatternsDto, @Request() req: any) {
    return this.patternService.analyzePatterns(dto, req.user.userId);
  }

  @Get('patterns/:subjectId')
  @ApiOperation({ summary: 'Get all patterns for a subject' })
  async getPatterns(@Param('subjectId') subjectId: string) {
    return this.patternService.getPatternsBySubject(subjectId);
  }

  @Get('available-years/:subjectId')
  @ApiOperation({ summary: 'Get available exam years from uploaded exam papers' })
  async getAvailableYears(@Param('subjectId') subjectId: string) {
    return this.patternService.getAvailableExamYears(subjectId);
  }

  @Get('subjects-with-papers')
  @ApiOperation({ summary: 'Get subjects that have approved exam papers' })
  async getSubjectsWithPapers() {
    return this.patternService.getSubjectsWithExamPapers();
  }

  // ============================================================
  // Blueprint Endpoints
  // ============================================================

  @Post('blueprint')
  @ApiOperation({ summary: 'Generate exam blueprint from a pattern' })
  async generateBlueprint(@Body() dto: GenerateBlueprintDto) {
    return this.blueprintService.generateBlueprint(dto);
  }

  @Post('blueprint/default')
  @ApiOperation({ summary: 'Generate default blueprint without pattern' })
  @ApiQuery({ name: 'subjectId', required: true })
  @ApiQuery({ name: 'totalQuestions', required: true, type: Number })
  @ApiQuery({ name: 'duration', required: true, type: Number })
  async createDefaultBlueprint(
    @Query('subjectId') subjectId: string,
    @Query('totalQuestions') totalQuestions: number,
    @Query('duration') duration: number,
  ) {
    return this.blueprintService.createDefaultBlueprint(
      subjectId,
      Number(totalQuestions),
      Number(duration),
    );
  }

  // ============================================================
  // Model Exam CRUD Endpoints
  // ============================================================

  @Post()
  @ApiOperation({ summary: 'Create a new model exam' })
  async createModelExam(@Body() dto: CreateModelExamDto, @Request() req: any) {
    return this.modelExamService.createModelExam(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all model exams' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listModelExams(
    @Query('subjectId') subjectId?: string,
    @Query('status') status?: string,
  ) {
    return this.modelExamService.listModelExams({ subjectId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get model exam by ID with questions' })
  async getModelExam(@Param('id') id: string) {
    return this.modelExamService.getModelExamById(id);
  }

  @Post('generate-questions')
  @ApiOperation({ summary: 'Generate questions for a model exam' })
  async generateQuestions(@Body() dto: GenerateModelExamQuestionsDto, @Request() req: any) {
    return this.modelExamService.generateQuestions(dto, req.user.userId);
  }

  // ============================================================
  // Publish/Unpublish Endpoints
  // ============================================================

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a model exam' })
  async publishExam(@Param('id') id: string, @Request() req: any) {
    return this.modelExamService.publishExam(id, req.user.userId);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a model exam' })
  async unpublishExam(@Param('id') id: string) {
    return this.modelExamService.unpublishExam(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a model exam' })
  async archiveExam(@Param('id') id: string) {
    return this.modelExamService.archiveExam(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft model exam' })
  async deleteExam(@Param('id') id: string) {
    await this.modelExamService.deleteExam(id);
    return { success: true, message: 'Model exam deleted' };
  }
}

/**
 * Student endpoints for taking model exams.
 */
@ApiTags('Student - Model Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('model-exams')
export class ModelExamStudentController {
  constructor(private readonly modelExamService: ModelExamService) {}

  @Get()
  @ApiOperation({ summary: 'Get published model exams for students' })
  @ApiQuery({ name: 'subjectId', required: false })
  async getPublishedExams(@Query('subjectId') subjectId?: string) {
    return this.modelExamService.getPublishedExamsForStudent({ subjectId });
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a model exam session' })
  async startExam(@Param('id') id: string, @Request() req: any) {
    return this.modelExamService.startExamForStudent(req.user.userId, id);
  }
}
