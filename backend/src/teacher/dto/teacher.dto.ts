import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';

/**
 * DTO for creating a question as a teacher
 */
export class CreateTeacherQuestionDto {
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

  @ApiPropertyOptional({ description: 'The question text' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ description: 'Options for MCQ', type: [String] })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional({ description: 'Pairs for matching questions' })
  @IsOptional()
  @IsArray()
  pairs?: { left: string; right: string }[];

  @ApiPropertyOptional({ description: 'Correct answer' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ description: 'Hint for first wrong attempt' })
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiPropertyOptional({ description: 'Explanation for second wrong attempt' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization', type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Save as draft', default: true })
  @IsOptional()
  saveAsDraft?: boolean;
}

/**
 * DTO for updating a teacher's question
 */
export class UpdateTeacherQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  pairs?: { left: string; right: string }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

/**
 * DTO for duplicating a question
 */
export class DuplicateQuestionDto {
  @ApiProperty({ description: 'Target Grade ID' })
  @IsString()
  targetGradeId: string;

  @ApiProperty({ description: 'Target Subject ID' })
  @IsString()
  targetSubjectId: string;

  @ApiPropertyOptional({ description: 'Target Unit Number' })
  @IsOptional()
  @IsNumber()
  targetUnitNumber?: number;
}

/**
 * DTO for AI improve question request
 */
export class ImproveQuestionDto {
  @ApiProperty({ description: 'Question ID to improve' })
  @IsString()
  questionId: string;
}

/**
 * DTO for AI generate variations
 */
export class GenerateVariationsDto {
  @ApiProperty({ description: 'Question ID to generate variations from' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({ description: 'Number of variations', default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  count?: number;
}

/**
 * DTO for AI difficulty prediction
 */
export class PredictDifficultyDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  question: string;

  @ApiPropertyOptional({ description: 'Grade level context' })
  @IsOptional()
  @IsString()
  gradeId?: string;
}

/**
 * DTO for AI answer generation
 */
export class GenerateAnswerDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Question type' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  options?: string[];
}

/**
 * DTO for curriculum alignment check
 */
export class CheckAlignmentDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'Grade ID' })
  @IsString()
  gradeId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  subjectId: string;

  @ApiProperty({ description: 'Unit number' })
  @IsNumber()
  unitNumber: number;
}

/**
 * DTO for listing teacher's questions
 */
export class ListTeacherQuestionsDto {
  @ApiPropertyOptional({ enum: ['draft', 'pending', 'approved', 'rejected'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * DTO for AI full question generation
 */
export class GenerateFullQuestionDto {
  @ApiProperty({ description: 'Grade ID' })
  @IsString()
  gradeId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  subjectId: string;

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

  @ApiProperty({ enum: ['mcq', 'true-false', 'fill-blank', 'short-answer'] })
  @IsString()
  type: string;

  @ApiProperty({ enum: ['easy', 'medium', 'hard'] })
  @IsString()
  difficulty: string;
}

/**
 * DTO for batch AI question generation (N questions in 1 LLM call)
 */
export class BatchGenerateQuestionsDto {
  @ApiProperty({ description: 'Grade ID' })
  @IsString()
  gradeId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  subjectId: string;

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

  @ApiProperty({
    description: 'Array of questions to generate, each with type and difficulty',
    example: [{ type: 'mcq', difficulty: 'medium' }, { type: 'true-false', difficulty: 'easy' }],
  })
  questions: Array<{ type: string; difficulty: string }>;
}
