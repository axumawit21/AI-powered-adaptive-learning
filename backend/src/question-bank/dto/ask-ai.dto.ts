import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Ask AI about a specific quiz question
 * Uses question metadata to filter RAG retrieval to relevant content
 */
export class AskAIDto {
  @ApiProperty({ description: 'ID of the current question' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'The student\'s message/question' })
  @IsString()
  @IsNotEmpty()
  userMessage: string;

  @ApiProperty({ description: 'The question text for context' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ description: 'Grade title (e.g., "Grade 9")' })
  @IsString()
  @IsNotEmpty()
  gradeTitle: string;

  @ApiProperty({ description: 'Subject title (e.g., "Biology")' })
  @IsString()
  @IsNotEmpty()
  subjectTitle: string;

  @ApiProperty({ description: 'Unit number' })
  @IsNumber()
  unitNumber: number;

  @ApiProperty({ description: 'Unit title' })
  @IsString()
  @IsNotEmpty()
  unitTitle: string;

  @ApiPropertyOptional({ description: 'Subunit number (e.g., "1.1")' })
  @IsString()
  @IsOptional()
  subunitNumber?: string;

  @ApiPropertyOptional({ description: 'Subunit title' })
  @IsString()
  @IsOptional()
  subunitTitle?: string;
}
