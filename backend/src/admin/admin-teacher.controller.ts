import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminTeacherService } from './admin-teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

// Simple DTOs inline for this controller
class ListTeacherQuestionsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

class RejectQuestionDto {
  @IsString()
  comments: string;
}

@ApiTags('Admin - Teacher Questions')
@Controller('admin/teacher-questions')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminTeacherController {
  constructor(private readonly adminTeacherService: AdminTeacherService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get teacher question review stats' })
  async getStats() {
    return this.adminTeacherService.getReviewStats();
  }

  @Get()
  @ApiOperation({ summary: 'List teacher-submitted questions' })
  @ApiResponse({ status: 200, description: 'List of teacher questions' })
  async listQuestions(@Query() dto: ListTeacherQuestionsQueryDto) {
    return this.adminTeacherService.listPendingQuestions(dto);
  }

  @Get(':questionId')
  @ApiOperation({ summary: 'Get a specific teacher question for review' })
  async getQuestion(@Param('questionId') questionId: string) {
    return this.adminTeacherService.getQuestionForReview(questionId);
  }

  @Post(':questionId/approve')
  @ApiOperation({ summary: 'Approve a teacher-submitted question' })
  @ApiResponse({ status: 200, description: 'Question approved successfully' })
  async approveQuestion(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    const adminId = req.user?.userId || req.user?.sub || 'admin';
    return this.adminTeacherService.approveQuestion(questionId, adminId);
  }

  @Post(':questionId/reject')
  @ApiOperation({ summary: 'Reject a teacher-submitted question with comments' })
  @ApiBody({ type: RejectQuestionDto })
  @ApiResponse({ status: 200, description: 'Question rejected successfully' })
  async rejectQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: RejectQuestionDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.userId || req.user?.sub || 'admin';
    return this.adminTeacherService.rejectQuestion(questionId, adminId, dto.comments);
  }
}
