import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { DashboardStatsDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics', description: 'Returns counts of students, books, grades, subjects and other analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved', type: DashboardStatsDto })
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }
}
