import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AskAIService } from './ask-ai.service';
import { AskAIDto } from './dto/ask-ai.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Ask AI')
@Controller('question-bank')
export class AskAIController {
  private readonly logger = new Logger(AskAIController.name);

  constructor(private readonly askAIService: AskAIService) {}

  @Post('ask-ai')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Ask AI about a quiz question',
    description: 'Get AI-powered explanation for the concept behind a quiz question using RAG-filtered content',
  })
  @ApiResponse({ status: 200, description: 'AI explanation generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async askAboutQuestion(@Body() dto: AskAIDto) {
    this.logger.log(`Ask AI request for question: ${dto.questionId}`);
    const result = await this.askAIService.askAboutQuestion(dto);
    return {
      success: true,
      ...result,
    };
  }
}
