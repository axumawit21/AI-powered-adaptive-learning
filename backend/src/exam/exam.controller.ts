import { Controller, Post, Body, Get, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { GenerateExamDto, SubmitExamDto } from './dto/exam.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Exam')
@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate exam', description: 'Create a new exam session with questions' })
  async generate(@Request() req, @Body() body: GenerateExamDto) {
    return this.examService.generateExam(req.user.userId, body);
  }

  @Post('submit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit exam', description: 'Submit answers and get results' })
  async submit(@Request() req, @Body() body: SubmitExamDto) {
    return this.examService.submitExam(req.user.userId, body);
  }

  @Get('results/:examId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get results', description: 'Get detailed exam results' })
  async getResults(@Param('examId') examId: string) {
    return this.examService.getResults(examId);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get exam history', description: 'Get student exam history' })
  async getHistory(@Request() req) {
    return this.examService.getHistory(req.user.userId);
  }
  @Post('evaluate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('notesFile'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Evaluate Understanding', description: 'Evaluate student written/handwritten understanding of a topic' })
  async evaluate(
    @Request() req, 
    @Body() body: { grade: string; subject: string; unitIdentifier: string; studentInput?: string },
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.examService.evaluateUnderstanding(req.user.userId, body, file);
  }
}
