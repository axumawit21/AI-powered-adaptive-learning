import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class QuizRequestDto {
  @ApiProperty({ example: '60d5ec...', description: 'Grade ID' })
  @IsString()
  @IsNotEmpty()
  gradeId: string;

  @ApiProperty({ example: '60d5ec...', description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 'Algebra', description: 'Unit/chapter to generate quiz for' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ example: 5, description: 'Number of questions' })
  @IsOptional()
  @IsNumber()
  num_questions?: number;

  @ApiPropertyOptional({ example: 'Grade 9', description: 'Grade Title (optional)' })
  @IsOptional()
  @IsString()
  gradeTitle?: string;

  @ApiPropertyOptional({ example: 'Math', description: 'Subject Title (optional)' })
  @IsOptional()
  @IsString()
  subjectTitle?: string;

  @ApiPropertyOptional({ example: '6 questions, true/false', description: 'Custom quiz specification (optional)' })
  @IsOptional()
  @IsString()
  customSpecification?: string;

  @ApiPropertyOptional({ example: '1.1', description: 'Subunit number (optional, for subunit-level quiz)' })
  @IsOptional()
  @IsString()
  subunit?: string;

  @ApiPropertyOptional({ example: 'Cell Structure', description: 'Subunit title (optional)' })
  @IsOptional()
  @IsString()
  subunitTitle?: string;
}

export class QuizResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiPropertyOptional()
  data?: any;

  @ApiPropertyOptional()
  message?: string;
}

export class QuizSessionStartDto extends QuizRequestDto {
  @ApiPropertyOptional({ description: 'Existing Quiz ID to start session for' })
  @IsOptional()
  @IsString()
  quizId?: string;
}

export class QuizSessionAnswerDto {
  @ApiProperty({ example: 'session-uuid', description: 'Session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'A', description: 'Selected option' })
  @IsString()
  @IsNotEmpty()
  selected: string;
}

export class QuizSessionNextDto {
  @ApiProperty({ example: 'session-uuid', description: 'Session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class QuizSessionStartResponseDto {
  @ApiProperty({ example: 'session-uuid' })
  sessionId: string;

  @ApiProperty()
  question: any;
}

export class QuizSessionAnswerResponseDto {
  @ApiProperty({ example: true })
  correct: boolean;

  @ApiProperty({ example: 'Great job!' })
  message: string;

  @ApiPropertyOptional()
  hint?: string;

  @ApiPropertyOptional()
  correctAnswer?: string;

  @ApiPropertyOptional()
  askExplanation?: boolean;
}

export class QuizSessionNextResponseDto {
  @ApiProperty({ example: false })
  finished: boolean;

  @ApiPropertyOptional()
  question?: any;

  @ApiPropertyOptional()
  message?: string;
}
