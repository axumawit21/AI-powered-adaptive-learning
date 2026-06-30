// src/summary/summary.controller.ts
import { Controller, Post, Body, Logger, Get, Query, NotFoundException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { SummarizeService } from './summarize.service';
import { SummarizeDto, SummarizeResponseDto } from './dto/summary.dto';
import { Summary } from './schemas/summary.schema';

@ApiTags('Summary')
@Controller('summary')
export class SummarizeController {
  private readonly logger = new Logger(SummarizeController.name);

  constructor(private readonly summarizeService: SummarizeService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate Summary', description: 'Generate and store an AI-powered summary for a specific unit or subunit' })
  @ApiBody({ type: SummarizeDto })
  async generateSummary(@Body() dto: SummarizeDto): Promise<{ ok: boolean; data?: Summary; message?: string }> {
    try {
      let summary: Summary;
      
      // Route to subunit generation if type is 'subunit' and subunitIdentifier is provided
      if (dto.type === 'subunit' && dto.subunitIdentifier) {
        summary = await this.summarizeService.generateSubunitSummary(
          dto.gradeId,
          dto.subjectId,
          dto.unitIdentifier,
          dto.subunitIdentifier,
          dto.gradeTitle || 'Unknown Grade',
          dto.subjectTitle || 'Unknown Subject',
          dto.subunitTitle
        );
      } else {
        // Default to unit-level summary generation
        summary = await this.summarizeService.generateSummary(
          dto.gradeId,
          dto.subjectId,
          dto.unitIdentifier,
          dto.type,
          dto.gradeTitle || 'Unknown Grade',
          dto.subjectTitle || 'Unknown Subject'
        );
      }
      
      return { ok: true, data: summary };
    } catch (err: any) {
      this.logger.error(`Failed to generate summary: ${err.message}`);
      return { 
        ok: false, 
        message: err.message || 'Error generating summary' 
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get Summary', description: 'Retrieve a stored summary' })
  @ApiQuery({ name: 'grade', required: true })
  @ApiQuery({ name: 'subject', required: true })
  @ApiQuery({ name: 'unit', required: true })
  @ApiQuery({ name: 'subunit', required: false, description: 'Optional subunit identifier for subunit-specific summary' })
  async getSummary(
    @Query('grade') grade: string,
    @Query('subject') subject: string,
    @Query('unit') unit: string,
    @Query('subunit') subunit?: string
  ): Promise<{ ok: boolean; data?: Summary; message?: string }> {
    // Note: getSummary service method filters by status='approved' for students.
    // For admin purposes, we might want to see pending ones too, but keeping it consistent for now.
    const summary = await this.summarizeService.getSummary(grade, subject, unit, subunit);
    if (!summary) {
      const contentType = subunit ? 'subunit' : 'unit';
      return { ok: false, message: `No summary for this ${contentType}` };
    }
    return { ok: true, data: summary };
  }

  @Post('upload-audio')
  @ApiOperation({ summary: 'Upload Custom Audio', description: 'Upload audio file for summary' })
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
    storage: diskStorage({
      destination: './uploads/summary-audio',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
        cb(null, true);
      } else {
        cb(new BadRequestException(`Invalid file type: ${file.mimetype}. Only audio files are allowed!`), false);
      }
    },
  }))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    
    // Return the URL path
    const fileUrl = `/uploads/summary-audio/${file.filename}`;
    return { ok: true, url: fileUrl };
  }

  @Post('update-audio')
  @ApiOperation({ summary: 'Update Summary Audio URL' })
  @ApiBody({ schema: { properties: { summaryId: { type: 'string' }, audioUrl: { type: 'string' } } } })
  async updateAudioUrl(@Body() body: { summaryId: { _id: string } | string, audioUrl: string }) {
    try {
      // Handle both object ID wrapper and string
      const id = typeof body.summaryId === 'object' ? (body.summaryId as any)._id : body.summaryId;
      
      const summary = await this.summarizeService.updateCustomAudio(id, body.audioUrl);
      return { ok: true, data: summary };
    } catch (err: any) {
        this.logger.error(`Failed to update audio URL: ${err.message}`);
        return { ok: false, message: err.message };
    }
  }
}
