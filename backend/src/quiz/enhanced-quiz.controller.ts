import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Delete, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnhancedQuizService, QuizConfig } from './enhanced-quiz.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuestionType } from '../question-bank/schemas/question.schema';

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray } from 'class-validator';

class StartQuizDto {
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsOptional()
  gradeId?: string;

  @IsNumber()
  @IsOptional()
  unitNumber?: number;

  @IsString()
  @IsOptional()
  unitTitle?: string;

  @IsString()
  @IsOptional()
  subunitNumber?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'mixed'])
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';

  @IsNumber()
  @IsOptional()
  questionCount?: number;

  @IsArray()
  @IsOptional()
  @IsEnum(['mcq', 'true-false', 'fill-blank', 'short-answer', 'matching'], { each: true, message: 'each value in questionTypes must be a valid question type' })
  questionTypes?: string[];
}

class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  answer: string;
}

@ApiTags('Enhanced Quiz')
@Controller('quiz/enhanced')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EnhancedQuizController {
  private readonly logger = new Logger(EnhancedQuizController.name);
  constructor(private readonly enhancedQuizService: EnhancedQuizService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new quiz session with non-repeating questions' })
  @ApiResponse({ status: 201, description: 'Quiz session started successfully' })
  async startQuiz(@Body() dto: StartQuizDto, @Request() req: any) {
    const config: QuizConfig = {
      studentId: req.user.userId,
      subjectId: dto.subjectId,
      gradeId: dto.gradeId,
      unitNumber: dto.unitNumber,
      unitTitle: dto.unitTitle,
      subunitNumber: dto.subunitNumber,
      difficulty: dto.difficulty,
      questionCount: dto.questionCount,
      questionTypes: dto.questionTypes as QuestionType[],
    };
    return this.enhancedQuizService.startQuiz(config);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Submit an answer for the current question' })
  @ApiResponse({ status: 200, description: 'Answer submitted' })
  submitAnswer(@Body() dto: SubmitAnswerDto) {
    return this.enhancedQuizService.submitAnswer(dto.sessionId, dto.answer);
  }

  @Post('next/:sessionId')
  @ApiOperation({ summary: 'Move to the next question' })
  @ApiResponse({ status: 200, description: 'Next question or quiz completion' })
  async nextQuestion(@Param('sessionId') sessionId: string) {
    return this.enhancedQuizService.nextQuestion(sessionId);
  }

  @Get('status/:sessionId')
  @ApiOperation({ summary: 'Get current quiz session status' })
  getStatus(@Param('sessionId') sessionId: string) {
    return this.enhancedQuizService.getSessionStatus(sessionId);
  }

  @Delete('abandon/:sessionId')
  @ApiOperation({ summary: 'Abandon the current quiz' })
  async abandonQuiz(@Param('sessionId') sessionId: string) {
    await this.enhancedQuizService.abandonQuiz(sessionId);
    return { success: true, message: 'Quiz abandoned' };
  }
}
