import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnhancedExamService, ExamConfig, ExamSubmission } from './enhanced-exam.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class GenerateEnhancedExamDto {
  subjectId: string;
  gradeId?: string;
  type: 'unit' | 'subject' | 'comprehensive';
  unitNumber?: number;
  unitTitle?: string;
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'progressive';
  timeLimit?: number;
}

class SubmitEnhancedExamDto {
  examId: string;
  answers: { questionIndex: number; answer: string }[];
}

@ApiTags('Enhanced Exam')
@Controller('exam/enhanced')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnhancedExamController {
  private readonly logger = new Logger(EnhancedExamController.name);
  constructor(private readonly enhancedExamService: EnhancedExamService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new exam with non-repeating questions' })
  @ApiResponse({ status: 201, description: 'Exam generated successfully' })
  async generateExam(@Body() dto: GenerateEnhancedExamDto, @Request() req: any) {
    const config: ExamConfig = {
      studentId: req.user.userId,
      ...dto,
    };
    return this.enhancedExamService.generateExam(config);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit exam answers' })
  @ApiResponse({ status: 200, description: 'Exam graded and results returned' })
  async submitExam(@Body() dto: SubmitEnhancedExamDto, @Request() req: any) {
    const submission: ExamSubmission = {
      examId: dto.examId,
      answers: dto.answers,
    };
    return this.enhancedExamService.submitExam(req.user.userId, submission);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get exam history' })
  async getHistory(@Query('subjectId') subjectId: string, @Request() req: any) {
    return this.enhancedExamService.getExamHistory(req.user.userId, subjectId);
  }

  @Get('results/:examId')
  @ApiOperation({ summary: 'Get detailed exam results' })
  async getResults(@Param('examId') examId: string, @Request() req: any) {
    return this.enhancedExamService.getExamResults(examId, req.user.userId);
  }
}
