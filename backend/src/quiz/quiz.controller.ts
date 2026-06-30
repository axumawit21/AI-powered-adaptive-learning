import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { Quiz } from './quiz.schema';
import { QuizRequestDto, QuizResponseDto } from './dto/quiz.dto';

@ApiTags('Quiz')
@Controller('quiz')
export class QuizController {
  private readonly logger = new Logger(QuizController.name);

  constructor(private readonly quizService: QuizService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a quiz', description: 'Generate an AI-powered quiz for a specific unit/chapter or subunit' })
  @ApiBody({ type: QuizRequestDto })
  @ApiResponse({ status: 200, description: 'Quiz generated successfully', type: QuizResponseDto })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  async generateQuiz(@Body() dto: QuizRequestDto): Promise<{ ok: boolean; data?: Quiz; message?: string }> {
    this.logger.log(`Received quiz request: ${JSON.stringify(dto)}`);

    const { gradeId, subjectId, unit, subunit, subunitTitle, num_questions, gradeTitle, subjectTitle, customSpecification } = dto;

    // Validate required fields
    if (!gradeId || !subjectId || !unit) {
      return { ok: false, message: 'gradeId, subjectId, and unit are required' };
    }

    try {
      const quiz = await this.quizService.generateQuiz({ 
          gradeId, 
          subjectId, 
          unit, 
          subunit, // NEW: pass subunit
          subunitTitle, // NEW: pass subunit title
          num_questions,
          gradeTitle,
          subjectTitle,
          customSpecification // Pass through the custom specification
      });
      return { ok: true, data: quiz };
    } catch (err: any) {
      this.logger.error(`Failed to generate quiz: ${err?.message || err}`);
      return { ok: false, message: err?.message || 'Error generating quiz' };
    }
  }
}
