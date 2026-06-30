import { Controller, Post, Get, Body, Query, Param, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionBankService } from './question-bank.service';
import {
  CreateQuestionDto,
  GenerateQuestionsDto,
  FetchQuestionsDto,
  RecordAttemptDto,
  QuestionBankStatsDto,
  CheckAvailableQuestionsDto,
  FilterQuestionsDto,
} from './dto/question-bank.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Question Bank')
@Controller('question-bank')
export class QuestionBankController {
  private readonly logger = new Logger(QuestionBankController.name);
  constructor(private readonly questionBankService: QuestionBankService) {}

  // ==================== QUESTION CREATION (Admin) ====================

  @Post('create')
  @ApiOperation({ summary: 'Create a single question' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  async createQuestion(@Body() dto: CreateQuestionDto) {
    return this.questionBankService.createQuestion(dto);
  }

  @Post('bulk-create')
  @ApiOperation({ summary: 'Bulk create questions' })
  @ApiResponse({ status: 201, description: 'Questions created successfully' })
  async bulkCreateQuestions(@Body() questions: CreateQuestionDto[]) {
    return this.questionBankService.bulkCreateQuestions(questions);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate questions using LLM for a unit' })
  @ApiResponse({ status: 201, description: 'Questions generated and stored' })
  async generateQuestions(@Body() dto: GenerateQuestionsDto) {
    return this.questionBankService.generateQuestions(dto);
  }

  // ==================== QUESTION FETCHING (For Quiz/Exam) ====================

  @Post('fetch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch questions for quiz/exam (excludes attempted)' })
  @ApiResponse({ status: 200, description: 'Questions fetched successfully' })
  async fetchQuestions(@Body() dto: FetchQuestionsDto, @Request() req: any) {
    // Override studentId with authenticated user for security
    dto.studentId = req.user?.userId || dto.studentId;
    return this.questionBankService.fetchQuestionsForStudent(dto);
  }

  @Post('fetch-mixed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch mixed difficulty questions' })
  @ApiResponse({ status: 200, description: 'Mixed difficulty questions fetched' })
  async fetchMixedQuestions(@Body() dto: FetchQuestionsDto, @Request() req: any) {
    dto.studentId = req.user?.userId || dto.studentId;
    return this.questionBankService.fetchMixedDifficultyQuestions(dto);
  }

  // ==================== ATTEMPT TRACKING ====================

  @Post('record-attempt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record attempted questions after quiz/exam completion' })
  @ApiResponse({ status: 200, description: 'Attempts recorded successfully' })
  async recordAttempt(@Body() dto: RecordAttemptDto, @Request() req: any) {
    dto.studentId = req.user?.userId || dto.studentId;
    await this.questionBankService.recordAttemptedQuestions(dto);
    return { success: true, message: 'Attempts recorded' };
  }

  @Get('attempted/:subjectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attempted question IDs for a subject' })
  async getAttemptedIds(
    @Param('subjectId') subjectId: string,
    @Query('unitNumber') unitNumber: number,
    @Request() req: any,
  ) {
    const studentId = req.user?.userId;
    return this.questionBankService.getAttemptedQuestionIds(
      studentId,
      subjectId,
      unitNumber ? Number(unitNumber) : undefined,
    );
  }

  // ==================== STATISTICS ====================

  @Get('stats')
  @ApiOperation({ summary: 'Get question bank statistics' })
  async getStats(@Query() dto: QuestionBankStatsDto) {
    return this.questionBankService.getQuestionBankStats(dto);
  }

  // ==================== ADMIN FILTERING ====================

  @Get('filter')
  @ApiOperation({ summary: 'Filter questions for admin panel with counts' })
  @ApiResponse({ status: 200, description: 'Filtered questions with total count' })
  async filterQuestions(@Query() dto: FilterQuestionsDto) {
    return this.questionBankService.filterQuestions(dto);
  }

  @Post('check-available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check available unattempted questions for student' })
  async checkAvailable(@Body() dto: CheckAvailableQuestionsDto, @Request() req: any) {
    const originalId = dto.studentId;
    dto.studentId = req.user?.userId || dto.studentId;
    return this.questionBankService.checkAvailableQuestions(dto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get student attempt history' })
  async getHistory(@Query('subjectId') subjectId: string, @Request() req: any) {
    return this.questionBankService.getStudentAttemptHistory(req.user?.userId, subjectId);
  }

  @Get('debug/list')
  @ApiOperation({ summary: 'DEBUG: List all questions with their IDs (for troubleshooting)' })
  async debugListQuestions() {
    return this.questionBankService.debugListAllQuestions();
  }
}
