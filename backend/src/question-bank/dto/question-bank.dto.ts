import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min, Max, IsBoolean } from 'class-validator';
import { DifficultyLevel, QuestionType } from '../schemas/question.schema';

/**
 * DTO for creating a single question
 */
export class CreateQuestionDto {
  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  subjectId: string;

  @ApiProperty({ description: 'Grade ID' })
  @IsString()
  gradeId: string;

  @ApiProperty({ description: 'Unit number', example: 1 })
  @IsNumber()
  unitNumber: number;

  @ApiProperty({ description: 'Unit title' })
  @IsString()
  unitTitle: string;

  @ApiPropertyOptional({ description: 'Subunit number', example: '1.1' })
  @IsOptional()
  @IsString()
  subunitNumber?: string;

  @ApiPropertyOptional({ description: 'Subunit title' })
  @IsOptional()
  @IsString()
  subunitTitle?: string;

  @ApiProperty({ enum: ['mcq', 'true-false', 'fill-blank', 'short-answer', 'matching'] })
  @IsEnum(['mcq', 'true-false', 'fill-blank', 'short-answer', 'matching'])
  type: string;

  @ApiProperty({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty: string;

  @ApiProperty({ description: 'The question text' })
  @IsString()
  question: string;

  @ApiPropertyOptional({ description: 'Options for MCQ', type: [String] })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional({ description: 'Pairs for matching questions' })
  @IsOptional()
  @IsArray()
  pairs?: { left: string; right: string }[];

  @ApiProperty({ description: 'Correct answer' })
  @IsString()
  answer: string;

  @ApiProperty({ description: 'Hint for first wrong attempt' })
  @IsString()
  hint: string;

  @ApiProperty({ description: 'Explanation for second wrong attempt' })
  @IsString()
  explanation: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

/**
 * DTO for bulk question generation using LLM
 */
export class GenerateQuestionsDto {
  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  subjectId: string;

  @ApiProperty({ description: 'Grade ID' })
  @IsString()
  gradeId: string;

  @ApiProperty({ description: 'Unit number' })
  @IsNumber()
  unitNumber: number;

  @ApiProperty({ description: 'Unit title' })
  @IsString()
  unitTitle: string;

  @ApiPropertyOptional({ description: 'Subunit number' })
  @IsOptional()
  @IsString()
  subunitNumber?: string;

  @ApiPropertyOptional({ description: 'Subunit title' })
  @IsOptional()
  @IsString()
  subunitTitle?: string;

  @ApiPropertyOptional({ description: 'Number of questions to generate per difficulty', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  questionsPerDifficulty?: number;

  @ApiPropertyOptional({ description: 'Question types to generate', type: [String] })
  @IsOptional()
  @IsArray()
  questionTypes?: string[];

  @ApiPropertyOptional({ description: 'Specific difficulties to generate for', type: [String] })
  @IsOptional()
  @IsArray()
  difficulties?: string[];

  @ApiPropertyOptional({ description: 'Book ID for context' })
  @IsOptional()
  @IsString()
  bookId?: string;
}

/**
 * DTO for fetching questions (quiz/exam generation)
 */
export class FetchQuestionsDto {
  @ApiProperty({ description: 'Student ID to exclude attempted questions' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ description: 'Grade ID' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'Unit number' })
  @IsOptional()
  @IsNumber()
  unitNumber?: number;

  @ApiPropertyOptional({ description: 'Subunit number' })
  @IsOptional()
  @IsString()
  subunitNumber?: string;

  @ApiPropertyOptional({ description: 'Difficulty level' })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Number of questions to fetch', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  count?: number;

  @ApiPropertyOptional({ description: 'Question types to include', type: [String] })
  @IsOptional()
  @IsArray()
  questionTypes?: string[];

  @ApiPropertyOptional({ description: 'Context of the fetch', enum: ['quiz', 'exam', 'practice'] })
  @IsOptional()
  @IsString()
  context?: 'quiz' | 'exam' | 'practice';
}

/**
 * DTO for recording attempted questions
 */
export class RecordAttemptDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ description: 'Grade ID' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'Unit number' })
  @IsOptional()
  @IsNumber()
  unitNumber?: number;

  @ApiProperty({ description: 'Array of question IDs attempted', type: [String] })
  @IsArray()
  questionIds: string[];

  @ApiPropertyOptional({ description: 'Context of the attempt', enum: ['quiz', 'exam', 'practice'] })
  @IsOptional()
  @IsString()
  context?: 'quiz' | 'exam' | 'practice';

  @ApiPropertyOptional({ description: 'Session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Results for each question' })
  @IsOptional()
  @IsArray()
  results?: { questionId: string; wasCorrect: boolean }[];
}

/**
 * DTO for getting question bank statistics
 */
export class QuestionBankStatsDto {
  @ApiPropertyOptional({ description: 'Subject ID' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Grade ID' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'Unit number' })
  @IsOptional()
  @IsNumber()
  unitNumber?: number;
}

/**
 * DTO for checking available questions for a student
 */
export class CheckAvailableQuestionsDto {
  @ApiProperty({ description: 'Student ID' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ description: 'Grade ID' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'Unit number' })
  @IsOptional()
  @IsNumber()
  unitNumber?: number;

  @ApiPropertyOptional({ description: 'Difficulty level' })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Question types', type: [String] })
  @IsOptional()
  @IsArray()
  questionTypes?: string[];
}

/**
 * DTO for filtering questions (Admin panel)
 */
export class FilterQuestionsDto {
  @ApiPropertyOptional({ description: 'Grade ID' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'Subject ID' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Question type', enum: ['mcq', 'true-false', 'fill-blank', 'short-answer', 'matching'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Difficulty level', enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
