import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export type ContentType = 'question' | 'summary' | 'presentation' | 'quiz' | 'model_exam';
export type ContentStatus = 'pending' | 'approved' | 'suspended';

export class QueryContentDto {
  @ApiPropertyOptional({ enum: ['pending', 'approved', 'suspended'] })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'suspended'])
  status?: ContentStatus;

  @ApiPropertyOptional({ enum: ['question', 'summary', 'presentation', 'quiz', 'model_exam'] })
  @IsOptional()
  @IsEnum(['question', 'summary', 'presentation', 'quiz', 'model_exam'])
  type?: ContentType;

  @ApiPropertyOptional({ enum: ['mcq', 'true-false', 'fill-blank', 'short-answer', 'matching'] })
  @IsOptional()
  @IsEnum(['mcq', 'true-false', 'fill-blank', 'short-answer', 'matching'])
  questionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export class ModerateContentDto {
  @ApiProperty({ enum: ['approved', 'suspended'] })
  @IsEnum(['approved', 'suspended'])
  status: 'approved' | 'suspended';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewerComment?: string;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional()
  @IsOptional()
  options?: string[];

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
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: string;
}

export class UpdateSummaryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  generalSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detailedSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  keyConcepts?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  teacherAudioScript?: {
    introduction?: string;
    explanation?: string;
    examples?: string;
    recap?: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  dialogueScript?: Array<{
    speaker: 'male' | 'female';
    text: string;
  }>;
}

export class UpdatePresentationDto {
  @ApiPropertyOptional()
  @IsOptional()
  slides?: Array<{
    slideNumber: number;
    title: string;
    bulletPoints: string[];
  }>;
}

export class ContentResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  type: ContentType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  unit: string;

  @ApiPropertyOptional()
  difficulty?: string;

  @ApiProperty()
  status: ContentStatus;

  @ApiProperty()
  source: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ContentListResponseDto {
  @ApiProperty({ type: [ContentResponseDto] })
  items: ContentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ContentStatsDto {
  @ApiProperty()
  totalPending: number;

  @ApiProperty()
  totalApproved: number;

  @ApiProperty()
  totalSuspended: number;

  @ApiProperty()
  byType: {
    question: { pending: number; approved: number; suspended: number };
    summary: { pending: number; approved: number; suspended: number };
    presentation: { pending: number; approved: number; suspended: number };
    quiz: { pending: number; approved: number; suspended: number };
  };
}
