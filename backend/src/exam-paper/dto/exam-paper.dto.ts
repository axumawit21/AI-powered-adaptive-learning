import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsMongoId, IsEnum, IsArray, IsBoolean, Min, Max } from 'class-validator';

// Upload DTO
export class UploadExamPaperDto {
  @ApiProperty({ description: 'Grade ID' })
  @IsMongoId()
  gradeId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsMongoId()
  subjectId: string;

  @ApiProperty({ description: 'Exam year', example: 2023 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  examYear: number;
}

// Create Question DTO
export class CreateExamQuestionDto {
  @ApiProperty({ description: 'Question number' })
  @IsNumber()
  questionNumber: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hint?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;
}

// Update Question DTO
export class UpdateExamQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hint?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reviewerComment?: string;

  @ApiPropertyOptional({ description: 'URL/path to question image' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Whether question has an image' })
  @IsBoolean()
  @IsOptional()
  hasImage?: boolean;

  @ApiPropertyOptional({ description: 'Textual description of the image for LLM context' })
  @IsString()
  @IsOptional()
  imageDescription?: string;

  @ApiPropertyOptional({ description: 'URLs for option images (A, B, C, D)', type: [String] })
  @IsArray()
  @IsOptional()
  optionImageUrls?: (string | null)[];

  @ApiPropertyOptional({ description: 'Descriptions for option images (A, B, C, D)', type: [String] })
  @IsArray()
  @IsOptional()
  optionImageDescriptions?: (string | null)[];
}


// Approve/Reject DTO
export class ApproveRejectQuestionDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'needs_review'] })
  @IsEnum(['approved', 'rejected', 'needs_review'])
  status: 'approved' | 'rejected' | 'needs_review';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reviewerComment?: string;
}

// Filter DTO for listing exam papers
export class FilterExamPapersDto {
  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  examYear?: number;

  @ApiPropertyOptional({ enum: ['processing', 'pending_review', 'approved', 'rejected'] })
  @IsEnum(['processing', 'pending_review', 'approved', 'rejected'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

// Student filter for approved exams
export class StudentExamFilterDto {
  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  gradeId?: string;

  @ApiPropertyOptional()
  @IsMongoId()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  examYear?: number;
}

// Response DTOs
export class ExamPaperResponseDto {
  id: string;
  fileName: string;
  gradeId: string;
  gradeTitle: string;
  subjectId: string;
  subjectTitle: string;
  examYear: number;
  status: string;
  questionsCount: number;
  approvedQuestionsCount: number;
  createdAt: Date;
}

export class ExamQuestionResponseDto {
  id: string;
  questionNumber: number;
  question: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
  approvalStatus: string;
  reviewerComment?: string;
  imageUrl?: string;
  hasImage?: boolean;
  imageDescription?: string;
  optionImageUrls?: (string | null)[];
  optionImageDescriptions?: (string | null)[];
}

