import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Patch, 
  Delete, 
  Body, 
  Query, 
  Param, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeacherService } from './teacher.service';
import { TeacherUserService } from './teacher-user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeacherGuard } from './teacher.guard';
import {
  CreateTeacherQuestionDto,
  UpdateTeacherQuestionDto,
  DuplicateQuestionDto,
  ListTeacherQuestionsDto,
  ImproveQuestionDto,
  GenerateVariationsDto,
  PredictDifficultyDto,
  GenerateAnswerDto,
  CheckAlignmentDto,
  GenerateFullQuestionDto,
  BatchGenerateQuestionsDto,
} from './dto/teacher.dto';

// DTO for API key update
class UpdateTeacherApiKeyDto {
  @IsString()
  @IsNotEmpty()
  geminiApiKey: string;
}

@ApiTags('Teacher')
@Controller('teacher')
@UseGuards(JwtAuthGuard, TeacherGuard)
@ApiBearerAuth()
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly teacherUserService: TeacherUserService,
  ) {}

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get teacher dashboard stats' })
  async getDashboard(@Request() req: any) {
    return this.teacherService.getDashboardStats(req.user.userId);
  }

  // ==================== API KEY (BYOK) ====================

  @Patch('api-key')
  @ApiOperation({ summary: 'Save or update personal Gemini API key' })
  async updateApiKey(@Request() req: any, @Body() dto: UpdateTeacherApiKeyDto) {
    await this.teacherUserService.updateApiKey(req.user.userId, dto.geminiApiKey);
    return { ok: true, message: 'API key saved successfully' };
  }

  @Delete('api-key')
  @ApiOperation({ summary: 'Remove personal Gemini API key' })
  async removeApiKey(@Request() req: any) {
    await this.teacherUserService.updateApiKey(req.user.userId, null);
    return { ok: true, message: 'API key removed' };
  }

  @Get('api-key/status')
  @ApiOperation({ summary: 'Check if teacher has a personal API key' })
  async getApiKeyStatus(@Request() req: any) {
    const teacher = await this.teacherUserService.findOne(req.user.userId);
    return { ok: true, hasApiKey: !!teacher?.geminiApiKey };
  }

  // ==================== QUESTION CRUD ====================

  @Post('questions')
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  async createQuestion(
    @Body() dto: CreateTeacherQuestionDto,
    @Request() req: any,
  ) {
    return this.teacherService.createQuestion(req.user.userId, dto);
  }

  @Get('questions')
  @ApiOperation({ summary: 'List teacher\'s own questions' })
  async listQuestions(
    @Query() dto: ListTeacherQuestionsDto,
    @Request() req: any,
  ) {
    return this.teacherService.listQuestions(req.user.userId, dto);
  }

  @Get('questions/:questionId')
  @ApiOperation({ summary: 'Get a specific question' })
  async getQuestion(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return this.teacherService.getQuestion(req.user.userId, questionId);
  }

  @Put('questions/:questionId')
  @ApiOperation({ summary: 'Update a question (draft/rejected only)' })
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateTeacherQuestionDto,
    @Request() req: any,
  ) {
    return this.teacherService.updateQuestion(req.user.userId, questionId, dto);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete a draft question' })
  async deleteQuestion(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    await this.teacherService.deleteQuestion(req.user.userId, questionId);
    return { success: true, message: 'Question deleted' };
  }

  @Post('questions/:questionId/submit')
  @ApiOperation({ summary: 'Submit question for admin approval' })
  async submitForApproval(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return this.teacherService.submitForApproval(req.user.userId, questionId);
  }

  @Post('questions/:questionId/duplicate')
  @ApiOperation({ summary: 'Duplicate question to another grade/subject' })
  async duplicateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: DuplicateQuestionDto,
    @Request() req: any,
  ) {
    return this.teacherService.duplicateQuestion(req.user.userId, questionId, dto);
  }

  // ==================== AI TOOLS ====================

  @Post('ai/improve')
  @ApiOperation({ summary: 'AI: Improve question clarity' })
  async improveQuestion(
    @Body() dto: ImproveQuestionDto,
    @Request() req: any,
  ) {
    return this.teacherService.improveQuestion(req.user.userId, dto.questionId);
  }

  @Post('ai/variations')
  @ApiOperation({ summary: 'AI: Generate question variations' })
  async generateVariations(
    @Body() dto: GenerateVariationsDto,
    @Request() req: any,
  ) {
    return this.teacherService.generateVariations(
      req.user.userId,
      dto.questionId,
      dto.count || 3,
    );
  }

  @Post('ai/difficulty')
  @ApiOperation({ summary: 'AI: Predict question difficulty' })
  async predictDifficulty(@Body() dto: PredictDifficultyDto) {
    return this.teacherService.predictDifficulty(dto.question, dto.gradeId);
  }

  @Post('ai/answer')
  @ApiOperation({ summary: 'AI: Generate answer and explanation' })
  async generateAnswer(@Body() dto: GenerateAnswerDto) {
    return this.teacherService.generateAnswer(dto.question, dto.type, dto.options);
  }

  @Post('ai/alignment')
  @ApiOperation({ summary: 'AI: Check curriculum alignment' })
  async checkAlignment(@Body() dto: CheckAlignmentDto) {
    return this.teacherService.checkAlignment(
      dto.question,
      dto.gradeId,
      dto.subjectId,
      dto.unitNumber,
    );
  }

  @Post('ai/generate-question')
  @ApiOperation({ summary: 'AI: Generate a complete question with context from curriculum' })
  @ApiResponse({ status: 200, description: 'Question generated successfully' })
  async generateFullQuestion(@Body() dto: GenerateFullQuestionDto) {
    return this.teacherService.generateFullQuestion(dto);
  }

  @Post('ai/generate-questions-batch')
  @ApiOperation({ summary: 'AI: Generate multiple questions in a single LLM call (saves API quota)' })
  @ApiResponse({ status: 200, description: 'Questions generated successfully' })
  async generateBatchQuestions(@Body() dto: BatchGenerateQuestionsDto) {
    return this.teacherService.generateBatchQuestions(dto);
  }

  // ==================== CONTENT APPROVAL (Review Admin Content) ====================

  @Get('approvals')
  @ApiOperation({ summary: 'List all content pending teacher approval (questions, summaries, model exams)' })
  @ApiResponse({ status: 200, description: 'List of pending content items' })
  async listPendingApprovals(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('contentType') contentType?: string,
  ) {
    return this.teacherService.listPendingApprovals(
      req.user.userId,
      parseInt(page, 10),
      parseInt(limit, 10),
      contentType,
    );
  }

  @Get('approvals/count')
  @ApiOperation({ summary: 'Get count of pending approvals (all content types)' })
  @ApiResponse({ status: 200, description: 'Number of pending approvals by type' })
  async getPendingApprovalCount(@Request() req: any) {
    return this.teacherService.getPendingApprovalCount(req.user.userId);
  }

  @Post('approve/:contentId')
  @ApiOperation({ summary: 'Approve content (question, summary, or model exam)' })
  @ApiResponse({ status: 200, description: 'Content approved' })
  async approveContent(
    @Param('contentId') contentId: string,
    @Body('contentType') contentType: 'question' | 'summary' | 'model_exam',
    @Request() req: any,
  ) {
    return this.teacherService.approveContent(req.user.userId, contentId, contentType);
  }

  @Post('reject/:contentId')
  @ApiOperation({ summary: 'Reject content (sends back to admin with feedback)' })
  @ApiResponse({ status: 200, description: 'Content rejected' })
  async rejectContent(
    @Param('contentId') contentId: string,
    @Body('contentType') contentType: 'question' | 'summary' | 'model_exam',
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }
    return this.teacherService.rejectContent(req.user.userId, contentId, contentType, reason);
  }

  // Legacy endpoints for backward compatibility
  @Post('approve/question/:questionId')
  @ApiOperation({ summary: 'Approve a question (legacy endpoint)' })
  async approveQuestion(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return this.teacherService.approveQuestion(req.user.userId, questionId);
  }

  @Post('reject/question/:questionId')
  @ApiOperation({ summary: 'Reject a question (legacy endpoint)' })
  async rejectQuestion(
    @Param('questionId') questionId: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }
    return this.teacherService.rejectQuestion(req.user.userId, questionId, reason);
  }

  // ==================== EXAM BANK (Private Question Storage) ====================

  @Post('exam-bank/:questionId')
  @ApiOperation({ summary: 'Store a question to private exam bank' })
  @ApiResponse({ status: 201, description: 'Question stored in exam bank' })
  async storeToExamBank(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return this.teacherService.storeToExamBank(req.user.userId, questionId);
  }

  @Get('exam-bank')
  @ApiOperation({ summary: 'List questions in exam bank' })
  @ApiResponse({ status: 200, description: 'List of stored questions' })
  async listExamBank(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('unitNumber') unitNumber?: string,
    @Query('difficulty') difficulty?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.teacherService.listExamBank(
      req.user.userId,
      {
        unitNumber: unitNumber ? parseInt(unitNumber, 10) : undefined,
        difficulty,
        type,
        search,
      },
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('exam-bank/stats')
  @ApiOperation({ summary: 'Get exam bank statistics' })
  @ApiResponse({ status: 200, description: 'Exam bank stats' })
  async getExamBankStats(@Request() req: any) {
    return this.teacherService.getExamBankStats(req.user.userId);
  }

  @Delete('exam-bank/:questionId')
  @ApiOperation({ summary: 'Remove question from exam bank' })
  @ApiResponse({ status: 200, description: 'Question removed from exam bank' })
  async removeFromExamBank(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    await this.teacherService.removeFromExamBank(req.user.userId, questionId);
    return { success: true, message: 'Question removed from exam bank' };
  }

  // ==================== EXAM MANAGEMENT ====================

  @Post('exams')
  @ApiOperation({ summary: 'Create a new exam' })
  @ApiResponse({ status: 201, description: 'Exam created' })
  async createExam(
    @Body() dto: {
      title: string;
      examType: 'quiz' | 'midterm' | 'final' | 'assignment';
      gradeId: string;
      subjectId: string;
      duration?: number;
      instructions?: string;
      schoolInfo?: { name?: string; address?: string; logo?: string };
    },
    @Request() req: any,
  ) {
    return this.teacherService.createExam(req.user.userId, dto);
  }

  @Get('exams')
  @ApiOperation({ summary: 'List teacher\'s exams' })
  @ApiResponse({ status: 200, description: 'List of exams' })
  async listExams(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('examType') examType?: string,
    @Query('status') status?: string,
  ) {
    return this.teacherService.listExams(
      req.user.userId,
      { examType, status },
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('exams/:examId')
  @ApiOperation({ summary: 'Get exam details' })
  @ApiResponse({ status: 200, description: 'Exam details' })
  async getExam(
    @Param('examId') examId: string,
    @Request() req: any,
  ) {
    return this.teacherService.getExam(req.user.userId, examId);
  }

  @Post('exams/:examId/questions')
  @ApiOperation({ summary: 'Add questions to exam from exam bank' })
  @ApiResponse({ status: 200, description: 'Questions added to exam' })
  async addQuestionsToExam(
    @Param('examId') examId: string,
    @Body() dto: { questionIds: string[]; defaultMarks?: number },
    @Request() req: any,
  ) {
    return this.teacherService.addQuestionsToExam(
      req.user.userId,
      examId,
      dto.questionIds,
      dto.defaultMarks || 1,
    );
  }

  @Delete('exams/:examId/questions/:questionId')
  @ApiOperation({ summary: 'Remove question from exam' })
  @ApiResponse({ status: 200, description: 'Question removed from exam' })
  async removeQuestionFromExam(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return this.teacherService.removeQuestionFromExam(req.user.userId, examId, questionId);
  }

  @Put('exams/:examId/questions/:questionId/marks')
  @ApiOperation({ summary: 'Update question marks in exam' })
  @ApiResponse({ status: 200, description: 'Question marks updated' })
  async updateQuestionMarks(
    @Param('examId') examId: string,
    @Param('questionId') questionId: string,
    @Body('marks') marks: number,
    @Request() req: any,
  ) {
    return this.teacherService.updateQuestionMarks(
      req.user.userId,
      examId,
      questionId,
      marks,
    );
  }

  @Post('exams/:examId/auto-build')
  @ApiOperation({ summary: 'Auto-populate exam using blueprint' })
  @ApiResponse({ status: 200, description: 'Exam auto-built' })
  async autoBuildExam(
    @Param('examId') examId: string,
    @Body() blueprint: {
      totalQuestions: number;
      difficultyDistribution?: { easy?: number; medium?: number; hard?: number };
      typeDistribution?: Record<string, number>;
      units?: number[];
      defaultMarks?: number;
    },
    @Request() req: any,
  ) {
    return this.teacherService.autoBuildExam(req.user.userId, examId, blueprint);
  }

  @Post('exams/:examId/finalize')
  @ApiOperation({ summary: 'Finalize exam (no more edits)' })
  @ApiResponse({ status: 200, description: 'Exam finalized' })
  async finalizeExam(
    @Param('examId') examId: string,
    @Request() req: any,
  ) {
    return this.teacherService.finalizeExam(req.user.userId, examId);
  }

  @Delete('exams/:examId')
  @ApiOperation({ summary: 'Delete a draft exam' })
  @ApiResponse({ status: 200, description: 'Exam deleted' })
  async deleteExam(
    @Param('examId') examId: string,
    @Request() req: any,
  ) {
    await this.teacherService.deleteExam(req.user.userId, examId);
    return { success: true, message: 'Exam deleted' };
  }
}

