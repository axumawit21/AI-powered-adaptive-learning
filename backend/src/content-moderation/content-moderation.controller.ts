import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContentModerationService } from './content-moderation.service';
import {
  QueryContentDto,
  ModerateContentDto,
  UpdateQuestionDto,
  UpdateSummaryDto,
  UpdatePresentationDto,
  ContentListResponseDto,
  ContentStatsDto,
} from './dto/content-moderation.dto';

type ContentType = 'question' | 'summary' | 'presentation' | 'quiz' | 'model_exam';

@ApiTags('Content Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('content-moderation')
export class ContentModerationController {
  constructor(private readonly contentModerationService: ContentModerationService) {}

  @Get()
  @ApiOperation({ summary: 'List all content with filters' })
  @ApiResponse({ status: 200, description: 'Content list', type: ContentListResponseDto })
  async findAll(@Query() query: QueryContentDto) {
    return this.contentModerationService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get content moderation statistics' })
  @ApiResponse({ status: 200, description: 'Content stats', type: ContentStatsDto })
  async getStats() {
    return this.contentModerationService.getStats();
  }

  // ========== TEACHER-SPECIFIC ENDPOINTS ==========

  @Get('teacher')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List content pending teacher approval' })
  @ApiResponse({ status: 200, description: 'Teacher pending approvals' })
  async findAllForTeacher(
    @Request() req: any,
    @Query('contentType') contentType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Pass teacherId — the service will look up grade/subject from DB
    const teacherId = req.user?.sub || req.user?._id;
    return this.contentModerationService.findAllForTeacher({
      teacherId,
      contentType: contentType as ContentType,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('teacher/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get teacher-specific approval stats' })
  @ApiResponse({ status: 200, description: 'Teacher pending counts' })
  async getTeacherStats(@Request() req: any) {
    const teacherId = req.user?.sub || req.user?._id;
    return this.contentModerationService.getTeacherStats(teacherId);
  }

  @Post('teacher/:type/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Teacher approves content' })
  @ApiParam({ name: 'type', enum: ['question', 'summary', 'model_exam'] })
  @ApiResponse({ status: 200, description: 'Content approved by teacher' })
  async teacherApprove(
    @Request() req: any,
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.contentModerationService.teacherApprove(
      type as ContentType,
      id,
      req.user?.sub || req.user?._id,
    );
  }

  @Post('teacher/:type/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Teacher rejects content' })
  @ApiParam({ name: 'type', enum: ['question', 'summary', 'model_exam'] })
  @ApiResponse({ status: 200, description: 'Content rejected by teacher' })
  async teacherReject(
    @Request() req: any,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.contentModerationService.teacherReject(
      type as ContentType,
      id,
      req.user?.sub || req.user?._id,
      body.reason || 'Rejected by teacher',
    );
  }

  // ========== ADMIN ENDPOINTS ==========

  @Get(':type/:id')
  @ApiOperation({ summary: 'Get single content item for review' })
  @ApiParam({ name: 'type', enum: ['question', 'summary', 'presentation', 'quiz', 'model_exam'] })
  @ApiResponse({ status: 200, description: 'Content item' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async findOne(
    @Param('type') type: string,
    @Param('id') id: string,
  ) {
    return this.contentModerationService.findOne(type as ContentType, id);
  }

  @Patch('question/:id')
  @ApiOperation({ summary: 'Update question content' })
  @ApiResponse({ status: 200, description: 'Question updated' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuestionDto,
  ) {
    return this.contentModerationService.update('question', id, updateDto);
  }

  @Patch('summary/:id')
  @ApiOperation({ summary: 'Update summary content' })
  @ApiResponse({ status: 200, description: 'Summary updated' })
  @ApiResponse({ status: 404, description: 'Summary not found' })
  async updateSummary(
    @Param('id') id: string,
    @Body() updateDto: UpdateSummaryDto,
  ) {
    return this.contentModerationService.update('summary', id, updateDto);
  }

  @Patch('presentation/:id')
  @ApiOperation({ summary: 'Update presentation content' })
  @ApiResponse({ status: 200, description: 'Presentation updated' })
  @ApiResponse({ status: 404, description: 'Presentation not found' })
  async updatePresentation(
    @Param('id') id: string,
    @Body() updateDto: UpdatePresentationDto,
  ) {
    return this.contentModerationService.update('presentation', id, updateDto);
  }

  @Post(':type/:id/approve')
  @ApiOperation({ summary: 'Approve content item' })
  @ApiParam({ name: 'type', enum: ['question', 'summary', 'presentation', 'quiz', 'model_exam'] })
  @ApiResponse({ status: 200, description: 'Content approved' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async approve(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { comment?: string; reviewedBy?: string },
  ) {
    return this.contentModerationService.approve(type as ContentType, id, body.comment, body.reviewedBy);
  }

  @Post(':type/:id/suspend')
  @ApiOperation({ summary: 'Suspend content item' })
  @ApiParam({ name: 'type', enum: ['question', 'summary', 'presentation', 'quiz', 'model_exam'] })
  @ApiResponse({ status: 200, description: 'Content suspended' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async suspend(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { comment?: string; reviewedBy?: string },
  ) {
    return this.contentModerationService.suspend(type as ContentType, id, body.comment, body.reviewedBy);
  }

  @Post(':type/bulk-approve')
  @ApiOperation({ summary: 'Bulk approve content items' })
  @ApiParam({ name: 'type', enum: ['question', 'summary', 'presentation', 'quiz', 'model_exam'] })
  @ApiResponse({ status: 200, description: 'Content approved' })
  async bulkApprove(
    @Param('type') type: string,
    @Body() body: { ids: string[]; reviewedBy?: string },
  ) {
    return this.contentModerationService.bulkApprove(type as ContentType, body.ids, body.reviewedBy);
  }

  @Post(':type/bulk-suspend')
  @ApiOperation({ summary: 'Bulk suspend content items' })
  @ApiParam({ name: 'type', enum: ['question', 'summary', 'presentation', 'quiz', 'model_exam'] })
  @ApiResponse({ status: 200, description: 'Content suspended' })
  async bulkSuspend(
    @Param('type') type: string,
    @Body() body: { ids: string[]; reviewedBy?: string },
  ) {
    return this.contentModerationService.bulkSuspend(type as ContentType, body.ids, body.reviewedBy);
  }
}
