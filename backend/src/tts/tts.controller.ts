import { Controller, Post, Get, Param, Res, NotFoundException, UseGuards, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { TtsService } from './tts.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Summary, SummaryDocument } from '../summary/schemas/summary.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as fs from 'fs';

@ApiTags('TTS')
@Controller('tts')
export class TtsController {
  constructor(
    private readonly ttsService: TtsService,
    @InjectModel(Summary.name) private summaryModel: Model<SummaryDocument>,
  ) {}

  @Post('generate/:summaryId')
  @ApiOperation({ summary: 'Generate audio for a summary' })
  async generateAudio(@Param('summaryId') summaryId: string) {
    // Find the summary
    const summary = await this.summaryModel.findById(summaryId);
    if (!summary) {
      throw new NotFoundException(`Summary not found: ${summaryId}`);
    }

    let audioFilePath: string;

    // Prefer dialogue script if available
    if (summary.dialogueScript && summary.dialogueScript.length > 0) {
      audioFilePath = await this.ttsService.generateDialogueAudio(
        summary.dialogueScript as any,
        summaryId,
      );
    } else if (summary.teacherAudioScript) {
      // Fall back to teacher script
      audioFilePath = await this.ttsService.generateTeacherAudio(
        summary.teacherAudioScript as any,
        summaryId,
      );
    } else {
      throw new BadRequestException('Summary has no audio script to generate from');
    }

    // Update summary with audio file path
    await this.summaryModel.findByIdAndUpdate(summaryId, {
      audioFilePath,
      audioGeneratedAt: new Date(),
    });

    return {
      success: true,
      message: 'Audio generated successfully',
      audioFilePath,
      audioUrl: `/tts/audio/${audioFilePath}`,
    };
  }

  @Post('generate-teacher/:summaryId')
  @ApiOperation({ summary: 'Generate teacher-style audio (single voice)' })
  async generateTeacherAudio(@Param('summaryId') summaryId: string) {
    const summary = await this.summaryModel.findById(summaryId);
    if (!summary) {
      throw new NotFoundException(`Summary not found: ${summaryId}`);
    }

    if (!summary.teacherAudioScript) {
      throw new BadRequestException('Summary has no teacher audio script');
    }

    const audioFilePath = await this.ttsService.generateTeacherAudio(
      summary.teacherAudioScript as any,
      summaryId,
    );

    await this.summaryModel.findByIdAndUpdate(summaryId, {
      audioFilePath,
      audioGeneratedAt: new Date(),
    });

    return {
      success: true,
      message: 'Teacher audio generated successfully',
      audioFilePath,
      audioUrl: `/tts/audio/${audioFilePath}`,
    };
  }

  @Post('generate-dialogue/:summaryId')
  @ApiOperation({ summary: 'Generate dialogue-style audio (male/female conversation)' })
  async generateDialogueAudio(@Param('summaryId') summaryId: string) {
    const summary = await this.summaryModel.findById(summaryId);
    if (!summary) {
      throw new NotFoundException(`Summary not found: ${summaryId}`);
    }

    if (!summary.dialogueScript || summary.dialogueScript.length === 0) {
      throw new BadRequestException('Summary has no dialogue script');
    }

    const audioFilePath = await this.ttsService.generateDialogueAudio(
      summary.dialogueScript as any,
      summaryId,
    );

    await this.summaryModel.findByIdAndUpdate(summaryId, {
      audioFilePath,
      audioGeneratedAt: new Date(),
    });

    return {
      success: true,
      message: 'Dialogue audio generated successfully',
      audioFilePath,
      audioUrl: `/tts/audio/${audioFilePath}`,
    };
  }

  @Get('audio/:filename')
  @ApiOperation({ summary: 'Stream audio file' })
  async getAudio(@Param('filename') filename: string, @Res() res: Response) {
    const audioPath = this.ttsService.getAudioPath(filename);
    
    if (!this.ttsService.audioExists(filename)) {
      throw new NotFoundException(`Audio file not found: ${filename}`);
    }

    // Use res.sendFile to handle Range requests, Content-Type, and Length automatically
    res.sendFile(audioPath);
  }

  @Get('voices')
  @ApiOperation({ summary: 'Get available voices' })
  getVoices() {
    return this.ttsService.getVoices();
  }
}
