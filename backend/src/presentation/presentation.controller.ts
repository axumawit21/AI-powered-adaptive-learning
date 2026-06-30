import { Controller, Post, Body, Get, Query, Logger, UseGuards } from '@nestjs/common';
import { PresentationService } from './presentation.service';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

class GeneratePresentationDto {
  @IsString()
  @IsNotEmpty()
  gradeId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsString()
  @IsOptional()
  gradeTitle?: string;

  @IsString()
  @IsOptional()
  subjectTitle?: string;
}

@ApiTags('Presentation')
@Controller('presentation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PresentationController {
  private readonly logger = new Logger(PresentationController.name);

  constructor(private readonly presentationService: PresentationService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate Presentation', description: 'Generate and store an AI-powered presentation outline for a specific unit' })
  async generatePresentation(@Body() dto: GeneratePresentationDto) {
    try {
      const data = await this.presentationService.generatePresentation({
        gradeId: dto.gradeId,
        subjectId: dto.subjectId,
        unit: dto.unit,
        gradeTitle: dto.gradeTitle || 'Unknown Grade',
        subjectTitle: dto.subjectTitle || 'Unknown Subject'
      });
      return { ok: true, data };
    } catch (err: any) {
      this.logger.error(`Failed to generate presentation: ${err.message}`);
      return { ok: false, message: err.message || 'Error generating presentation' };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get Presentation', description: 'Retrieve a stored presentation outline' })
  @ApiQuery({ name: 'grade', required: true })
  @ApiQuery({ name: 'subject', required: true })
  @ApiQuery({ name: 'unit', required: true })
  async getPresentation(
    @Query('grade') grade: string,
    @Query('subject') subject: string,
    @Query('unit') unit: string
  ) {
    const data = await this.presentationService.getPresentation(grade, subject, unit);
    if (!data) {
      return { ok: false, message: 'No generated PPT for specified unit' };
    }
    return { ok: true, data };
  }
}
