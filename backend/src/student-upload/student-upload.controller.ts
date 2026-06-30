import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { StudentUploadService } from './student-upload.service';

@ApiTags('Student Upload')
@ApiBearerAuth()
@Controller('student-upload')
export class StudentUploadController {
  constructor(private readonly uploadService: StudentUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file (PDF, image, or handwritten notes)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
      }
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const studentId = req.user?.sub || req.user?._id || 'anonymous';
    
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.uploadService.processUpload(studentId, file);
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files at once' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5, {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
      }
    },
  }))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[], @Req() req: any) {
    const studentId = req.user?.sub || req.user?._id || 'anonymous';
    
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const results = await Promise.all(
      files.map(file => this.uploadService.processUpload(studentId, file))
    );

    return {
      totalFiles: files.length,
      results,
    };
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask a question about uploaded content' })
  async askQuestion(
    @Body() body: { 
      question: string;
      grade?: string;
      subject?: string;
      sessionId?: string;
    }, 
    @Req() req: any
  ) {
    const studentId = req.user?.sub || req.user?._id || 'anonymous';
    
    if (!body.question) {
      throw new BadRequestException('Question is required');
    }

    return this.uploadService.askQuestion(
      studentId, 
      body.question,
      { grade: body.grade, subject: body.subject, sessionId: body.sessionId }
    );
  }

  @Post('quiz')
  @ApiOperation({ summary: 'Generate a quiz from uploaded content' })
  async generateQuiz(
    @Body() body: { 
      numQuestions?: number;
      grade?: string;
      subject?: string;
      sessionId?: string;
    }, 
    @Req() req: any
  ) {
    const studentId = req.user?.sub || req.user?._id || 'anonymous';
    return this.uploadService.generateQuiz(
      studentId, 
      body.numQuestions || 5,
      { grade: body.grade, subject: body.subject, sessionId: body.sessionId }
    );
  }

  @Get('session')
  @ApiOperation({ summary: 'Get current session info' })
  async getSession(@Req() req: any) {
    const studentId = req.user?.sub || req.user?._id || 'anonymous';
    const info = this.uploadService.getSessionInfo(studentId);
    
    return info || { fileCount: 0, chunkCount: 0, files: [] };
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all uploaded content from session' })
  async clearSession(@Req() req: any) {
    const studentId = req.user?.sub || req.user?._id || 'anonymous';
    this.uploadService.clearSession(studentId);
    return { message: 'Session cleared successfully' };
  }
}
