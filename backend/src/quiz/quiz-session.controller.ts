import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { QuizSessionService } from './quiz-session.service';
import { QuizService } from './quiz.service';
import { StartSessionResponse, SubmitAnswerResponse, NextQuestionResponse } from './quiz-session.types';
import { 
  QuizSessionStartDto, 
  QuizSessionAnswerDto, 
  QuizSessionNextDto,
  QuizSessionStartResponseDto,
  QuizSessionAnswerResponseDto,
  QuizSessionNextResponseDto
} from './dto/quiz.dto';

@ApiTags('Quiz Session')
@Controller('quiz-session')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class QuizSessionController {
  constructor(
    private readonly quizSessionService: QuizSessionService,
    private readonly quizService: QuizService,
  ) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a quiz session', description: 'Start a new interactive quiz session' })
  @ApiBody({ type: QuizSessionStartDto })
  @ApiResponse({ status: 200, description: 'Quiz session started', type: QuizSessionStartResponseDto })
  async start(@Request() req, @Body() body: QuizSessionStartDto): Promise<StartSessionResponse> {
    let quiz;
    if (body.quizId) {
       quiz = await this.quizService.getQuizById(body.quizId);
    } else {
       quiz = await this.quizService.generateQuiz(body);
    }
    
    // Pass student metadata for progress tracking
    const metadata = {
      studentId: req.user?.userId,
      gradeId: body.gradeId,
      subjectId: body.subjectId,
      unitNumber: body.unit,
    };
    
    return this.quizSessionService.startSession(quiz, metadata);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Submit an answer', description: 'Submit an answer for the current quiz question' })
  @ApiBody({ type: QuizSessionAnswerDto })
  @ApiResponse({ status: 200, description: 'Answer submitted', type: QuizSessionAnswerResponseDto })
  async answer(@Body() body: QuizSessionAnswerDto): Promise<SubmitAnswerResponse> {
    return this.quizSessionService.submitAnswer(body.sessionId, body.selected);
  }

  @Post('next')
  @ApiOperation({ summary: 'Get next question', description: 'Get the next question in the quiz session' })
  @ApiBody({ type: QuizSessionNextDto })
  @ApiResponse({ status: 200, description: 'Next question or finished', type: QuizSessionNextResponseDto })
  async next(@Body() body: QuizSessionNextDto): Promise<NextQuestionResponse> {
    return this.quizSessionService.nextQuestion(body.sessionId);
  }
}
