import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GoalService } from './goal.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('gamification')
@UseGuards(AuthGuard('jwt'))
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly goalService: GoalService,
  ) {}

  @Get('stats')
  getStats(@Req() req) {
    return this.gamificationService.getOrCreateStats(req.user.userId);
  }

  @Get('achievements')
  getAchievements(@Req() req) {
    return this.gamificationService.getStudentAchievements(req.user.userId);
  }

  @Get('achievements/all')
  getAllAchievements() {
    return this.gamificationService.getAllAchievements();
  }

  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: string) {
    return this.gamificationService.getLeaderboard(limit ? parseInt(limit) : 10);
  }

  @Post('activity')
  recordActivity(@Req() req, @Body() data: { type: string; data?: any }) {
    return this.gamificationService.recordActivity(req.user.userId, data.type, data.data);
  }

  // Goal endpoints
  @Post('goals')
  createGoal(@Req() req, @Body() goalData: any) {
    return this.goalService.createGoal(req.user.userId, goalData);
  }

  @Get('goals')
  getGoals(@Req() req, @Query() filters: { timeframe?: string; status?: string }) {
    return this.goalService.getStudentGoals(req.user.userId, filters);
  }

  @Get('goals/suggestions')
  getGoalSuggestions(@Req() req) {
    return this.goalService.getGoalSuggestions(req.user.userId);
  }

  @Get('goals/progress')
  getGoalProgress(@Req() req) {
    return this.goalService.getGoalProgress(req.user.userId);
  }

  @Get('goals/:id')
  getGoal(@Req() req, @Param('id') id: string) {
    return this.goalService.getGoal(id, req.user.userId);
  }

  @Post('goals/:id/progress')
  updateGoalProgress(@Req() req, @Param('id') id: string, @Body('increment') increment: number) {
    return this.goalService.updateGoalProgress(id, req.user.userId, increment);
  }

  @Post('goals/:id')
  updateGoal(@Req() req, @Param('id') id: string, @Body() updates: any) {
    return this.goalService.updateGoal(id, req.user.userId, updates);
  }

  @Post('goals/:id/delete')
  deleteGoal(@Req() req, @Param('id') id: string) {
    return this.goalService.deleteGoal(id, req.user.userId);
  }
}
