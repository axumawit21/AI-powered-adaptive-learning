import { Controller, Patch, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { AddTimeDto, ProgressResponseDto, WeeklyProgressResponseDto } from './dto/progress.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Progress')
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Patch('add-time')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add study time', description: 'Record study time for a student on a specific book' })
  @ApiBody({ type: AddTimeDto })
  @ApiResponse({ status: 200, description: 'Time added successfully', type: ProgressResponseDto })
  async addTime(@Request() req, @Body() body: AddTimeDto) {
    return this.progressService.addTime(req.user.userId, body.bookId, body.minutes, body.gradeId, body.subjectId, body.gradeTitle, body.subjectTitle);
  }

  @Patch('quiz-result')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add quiz result', description: 'Record a quiz attempt' })
  async addQuizResult(@Request() req, @Body() body: any) { // Using any or specific DTO
    return this.progressService.addQuizResult(req.user.userId, body);
  }

  @Get('overview') // Keep generic overview for raw data if needed, or deprecate
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getOverview(@Request() req) {
    return this.progressService.getOverview(req.user.userId);
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard overview', description: 'Get calculated stats for all subjects' })
  async getDashboard(@Request() req) {
    return this.progressService.getDashboardOverview(req.user.userId);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global study history', description: 'Get aggregated study time across all subjects' })
  async getHistory(@Request() req, @Query('days') days?: string) {
    return this.progressService.getGlobalHistory(req.user.userId, days ? parseInt(days) : 7);
  }

  @Post(':subjectId/analyze')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI Recommendations', description: 'Generate personalized study recommendations using AI' })
  async analyzeProgress(@Request() req, @Param('subjectId') subjectId: string) {
    return this.progressService.generateRecommendations(req.user.userId, subjectId);
  }

  @Get('subject/:subjectId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subject progress', description: 'Get progress for a specific subject' })
  async getSubject(@Request() req, @Param('subjectId') subjectId: string) {
    return this.progressService.getSubjectProgress(req.user.userId, subjectId);
  }

  @Get('weekly/:bookId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weekly progress', description: 'Get weekly study time breakdown for a student on a book' })
  @ApiParam({ name: 'bookId', description: 'Book MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Weekly progress retrieved', type: WeeklyProgressResponseDto })
  async getWeekly(
    @Request() req,
    @Param('bookId') bookId: string,
  ) {
    return this.progressService.getWeeklyProgress(req.user.userId, bookId);
  }

  @Get('monthly/:bookId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get monthly progress', description: 'Get last 30 days study time' })
  @ApiParam({ name: 'bookId', description: 'Book MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Monthly progress retrieved' })
  async getMonthly(
    @Request() req,
    @Param('bookId') bookId: string,
  ) {
    return this.progressService.getMonthlyProgress(req.user.userId, bookId);
  }
  @Get('activity-stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get activity stats', description: 'Get aggregated stats for specific type and timeframe' })
  async getActivityStats(@Request() req, @Query('type') type: string, @Query('timeframe') timeframe: string) {
    return this.progressService.calculateRecentActivity(req.user.userId, type, timeframe);
  }
}
