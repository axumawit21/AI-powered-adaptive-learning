import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExamPaperService } from './exam-paper.service';
import {
  UploadExamPaperDto,
  CreateExamQuestionDto,
  UpdateExamQuestionDto,
  ApproveRejectQuestionDto,
  FilterExamPapersDto,
  StudentExamFilterDto,
} from './dto/exam-paper.dto';

@ApiTags('exam-paper')
@Controller('exam-paper')
export class ExamPaperController {
  constructor(private readonly examPaperService: ExamPaperService) {}

  // ===== ADMIN ENDPOINTS =====

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type. Allowed: PDF, PNG, JPG, DOCX'), false);
      }
    },
  }))
  @ApiOperation({ summary: 'Upload an exam paper (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  async uploadExamPaper(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadExamPaperDto,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    
    const adminId = req.user?.studentId || req.user?.sub || 'admin';
    return this.examPaperService.uploadExamPaper(adminId, file, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List exam papers with filters (Admin)' })
  @ApiBearerAuth()
  async listExamPapers(@Query() dto: FilterExamPapersDto) {
    return this.examPaperService.listExamPapers(dto);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get dashboard stats (Admin)' })
  @ApiBearerAuth()
  async getDashboardStats() {
    return this.examPaperService.getDashboardStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get exam paper by ID' })
  @ApiBearerAuth()
  async getExamPaper(@Param('id') id: string) {
    return this.examPaperService.getExamPaperById(id);
  }

  @Get(':id/questions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get questions for review (Admin)' })
  @ApiBearerAuth()
  async getQuestionsForReview(
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.examPaperService.getQuestionsForReview(id, status);
  }

  @Patch(':id/questions/:questionId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a question (Admin)' })
  @ApiBearerAuth()
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: UpdateExamQuestionDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.studentId || req.user?.sub || 'admin';
    return this.examPaperService.updateQuestion(questionId, adminId, dto);
  }

  @Post(':id/questions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new question (Admin)' })
  @ApiBearerAuth()
  async createQuestion(
    @Param('id') id: string,
    @Body() dto: CreateExamQuestionDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.studentId || req.user?.sub || 'admin';
    return this.examPaperService.createQuestion(id, adminId, dto);
  }

  @Post(':id/questions/:questionId/analyze-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type. Allowed: PNG, JPG, WEBP'), false);
      }
    },
  }))
  @ApiOperation({ summary: 'Upload and analyze question image with LLM Vision (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  async analyzeQuestionImage(
    @Param('questionId') questionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    const adminId = req.user?.studentId || req.user?.sub || 'admin';
    return this.examPaperService.analyzeQuestionImage(questionId, file, adminId);
  }

  @Post(':id/questions/:questionId/analyze-option-image/:optionIndex')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type. Allowed: PNG, JPG, WEBP'), false);
      }
    },
  }))
  @ApiOperation({ summary: 'Upload and analyze option image with LLM Vision (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  async analyzeOptionImage(
    @Param('questionId') questionId: string,
    @Param('optionIndex') optionIndex: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    const index = parseInt(optionIndex, 10);
    if (isNaN(index) || index < 0 || index > 3) {
      throw new BadRequestException('Invalid option index. Must be 0, 1, 2, or 3 (for A, B, C, D)');
    }
    const adminId = req.user?.studentId || req.user?.sub || 'admin';
    return this.examPaperService.analyzeOptionImage(questionId, index, file, adminId);
  }


  @Post(':id/questions/:questionId/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve/Reject a question (Admin)' })
  @ApiBearerAuth()
  async setQuestionStatus(
    @Param('questionId') questionId: string,
    @Body() dto: ApproveRejectQuestionDto,
    @Req() req: any,
  ) {
    const adminId = req.user?.studentId || req.user?.sub || 'admin';
    return this.examPaperService.setQuestionStatus(questionId, adminId, dto);
  }

  @Post(':id/approve-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve all pending questions (Admin)' })
  @ApiBearerAuth()
  async approveAllQuestions(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const adminId = req.user?.studentId || req.user?.sub || 'admin';
    await this.examPaperService.approveAllQuestions(id, adminId);
    return { success: true, message: 'All questions approved' };
  }

  @Post(':id/reprocess')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reprocess exam paper (Admin)' })
  @ApiBearerAuth()
  async reprocessExamPaper(@Param('id') id: string) {
    await this.examPaperService.reprocessExamPaper(id);
    return { success: true, message: 'Reprocessing started' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete exam paper (Admin)' })
  @ApiBearerAuth()
  async deleteExamPaper(@Param('id') id: string) {
    await this.examPaperService.deleteExamPaper(id);
    return { success: true, message: 'Exam paper deleted' };
  }

  // ===== STUDENT ENDPOINTS =====

  @Get('approved/list')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get approved exams for students' })
  @ApiBearerAuth()
  async getApprovedExams(@Query() dto: StudentExamFilterDto) {
    return this.examPaperService.getApprovedExamsForStudent(dto);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start an exam session (Student)' })
  @ApiBearerAuth()
  async startExamSession(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const studentId = req.user?.studentId || req.user?.sub;
    return this.examPaperService.startExamSession(studentId, id);
  }
}
