import { Controller, Post, Param, Logger, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PreprocessService } from './preprocess.service';
import { EnhancedChunkingService } from '../rag/services/enhanced-chunking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('preprocess')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class PreprocessController {
  private readonly logger = new Logger(PreprocessController.name);

  constructor(
    private readonly preprocessService: PreprocessService,
    private readonly enhancedChunkingService: EnhancedChunkingService,
  ) {}

  /**
   * POST /preprocess/:bookId
   * Trigger basic preprocessing for a book by its MongoDB ID
   */
  @Post(':bookId')
  async preprocessBook(@Param('bookId') bookId: string) {
    try {
      const result = await this.preprocessService.preprocessBook(bookId);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to preprocess book ${bookId}`, error as any);
      throw new HttpException(
        { status: 'error', message: (error as Error).message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * POST /preprocess/enhanced/:bookId
   * Trigger ENHANCED preprocessing
   */
  @Post('enhanced/:bookId')
  async preprocessBookEnhanced(@Param('bookId') bookId: string) {
    try {
      this.logger.log(`Starting enhanced preprocessing for book ${bookId}`);
      const result = await this.enhancedChunkingService.preprocessBookEnhanced(bookId);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed enhanced preprocessing for book ${bookId}`, error as any);
      throw new HttpException(
        { status: 'error', message: (error as Error).message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}