import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// Pattern Analysis DTOs
// ============================================================

export class AnalyzeExamPatternsDto {
  @ApiProperty({ description: 'Subject ID to analyze' })
  @IsString()
  subjectId: string;

  @ApiProperty({ description: 'Exam years to analyze', example: [2020, 2022, 2023] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  selectedYears: number[];
}

export class ExamPatternResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  subjectTitle: string;

  @ApiProperty()
  sourceExamYears: number[];

  @ApiProperty()
  totalQuestionsAnalyzed: number;

  @ApiProperty()
  gradeDistribution: {
    grade9: number;
    grade10: number;
    grade11: number;
    grade12: number;
  };

  @ApiProperty()
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };

  @ApiProperty()
  unitFrequencies: {
    grade: number;
    unitNumber: number;
    unitTitle: string;
    frequency: number;
  }[];

  // ============================================================
  // ENHANCED v2.0 FIELDS
  // ============================================================

  @ApiPropertyOptional({ description: 'Image-based question pattern analysis' })
  imagePatternAnalysis?: {
    totalImageQuestions: number;
    imagePercentage: number;
    imagesByType: {
      diagram: number;
      graph: number;
      table: number;
      geometryFigure: number;
      labeledIllustration: number;
      other: number;
    };
    imagesByGrade: {
      grade9: number;
      grade10: number;
      grade11: number;
      grade12: number;
    };
    topUnitsWithImages: Array<{
      grade: number;
      unitNumber: number;
      unitTitle: string;
      imageCount: number;
      imagePercentage: number;
    }>;
    yearlyTrend: Array<{
      year: number;
      imageCount: number;
      imagePercentage: number;
    }>;
  };

  @ApiPropertyOptional({ description: 'Data-driven difficulty analysis' })
  difficultyAnalysis?: {
    distribution: { easy: number; medium: number; hard: number };
    isDataDriven: boolean;
    methodology: string;
    confidenceScore: number;
    yearlyDistribution: Array<{
      year: number;
      easy: number;
      medium: number;
      hard: number;
    }>;
  };

  @ApiPropertyOptional({ description: 'Unit importance scores with weighted formula' })
  unitImportanceScores?: Array<{
    grade: number;
    unitNumber: number;
    unitTitle: string;
    frequency: number;
    normalizedFrequency: number;
    averageDifficulty: number;
    gradeWeight: number;
    importanceScore: number;
    stabilityClass: 'stable' | 'moderate' | 'unstable';
    yearsAppeared: number[];
    hasImageQuestions: boolean;
    imageQuestionPercentage: number;
  }>;

  @ApiPropertyOptional({ description: 'Pattern stability analysis across years' })
  patternStability?: {
    overallStability: 'stable' | 'moderate' | 'unstable';
    gradeStability: {
      grade9: 'stable' | 'moderate' | 'unstable';
      grade10: 'stable' | 'moderate' | 'unstable';
      grade11: 'stable' | 'moderate' | 'unstable';
      grade12: 'stable' | 'moderate' | 'unstable';
    };
    stableUnits: Array<{ grade: number; unitNumber: number; unitTitle: string }>;
    unstableUnits: Array<{ grade: number; unitNumber: number; unitTitle: string }>;
    varianceMetrics: {
      gradeVariance: number;
      unitVariance: number;
      difficultyVariance: number;
      imageVariance: number;
    };
  };

  @ApiPropertyOptional({ description: 'Human-readable explanation of patterns' })
  explanation?: {
    summary: string;
    gradeExplanation: string;
    difficultyExplanation: string;
    unitExplanation: string;
    imageExplanation: string;
    recommendations: string[];
    generatedAt: Date;
  };

  @ApiPropertyOptional({ description: 'Analysis version' })
  analysisVersion?: string;

  @ApiProperty()
  createdAt: Date;
}

// ============================================================
// Blueprint DTOs
// ============================================================

export class BlueprintItemDto {
  @ApiProperty()
  @IsNumber()
  grade: number;

  @ApiProperty()
  @IsNumber()
  unitNumber: number;

  @ApiProperty()
  @IsString()
  unitTitle: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subunitNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subunitTitle?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  questionCount: number;

  @ApiProperty({ enum: ['easy', 'medium', 'hard'] })
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

export class GenerateBlueprintDto {
  @ApiProperty({ description: 'Pattern ID to base blueprint on' })
  @IsString()
  patternId: string;

  @ApiProperty({ description: 'Total number of questions', example: 60 })
  @IsNumber()
  @Min(10)
  @Max(200)
  totalQuestions: number;

  @ApiProperty({ description: 'Exam duration in minutes', example: 180 })
  @IsNumber()
  @Min(30)
  @Max(300)
  duration: number;

  @ApiPropertyOptional({ description: 'Custom exam title' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class BlueprintResponseDto {
  @ApiProperty()
  patternId: string;

  @ApiProperty()
  subjectTitle: string;

  @ApiProperty()
  totalQuestions: number;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  gradeDistribution: {
    grade9: number;
    grade10: number;
    grade11: number;
    grade12: number;
  };

  @ApiProperty()
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };

  @ApiProperty({ type: [BlueprintItemDto] })
  items: BlueprintItemDto[];
}

// ============================================================
// Model Exam Generation DTOs
// ============================================================

export class CreateModelExamDto {
  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  subjectId: string;

  @ApiPropertyOptional({ description: 'Subject title (optional, for display)' })
  @IsOptional()
  @IsString()
  subjectTitle?: string;

  @ApiProperty({ description: 'Exam title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Grade ID' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ description: 'Grade title (e.g., Grade 12)' })
  @IsOptional()
  @IsString()
  gradeTitle?: string;

  @ApiProperty({ description: 'Exam years this is based on' })
  @IsArray()
  @IsNumber({}, { each: true })
  basedOnYears: number[];

  @ApiProperty({ description: 'Duration in minutes' })
  @IsNumber()
  @Min(30)
  duration: number;

  @ApiProperty({ description: 'Total questions to generate' })
  @IsNumber()
  @Min(10)
  totalQuestions: number;

  @ApiPropertyOptional({ description: 'Pattern ID if using analyzed pattern' })
  @IsOptional()
  @IsString()
  patternId?: string;

  @ApiPropertyOptional({ description: 'Custom blueprint items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlueprintItemDto)
  blueprint?: BlueprintItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Exam type: real (timed, results at end) or practice (with hints)', enum: ['real', 'practice'] })
  @IsEnum(['real', 'practice'])
  examType: 'real' | 'practice';
}

export class GenerateModelExamQuestionsDto {
  @ApiProperty({ description: 'Model Exam ID to generate questions for' })
  @IsString()
  modelExamId: string;

  @ApiPropertyOptional({ description: 'Regenerate all questions even if some exist' })
  @IsOptional()
  regenerate?: boolean;
}

// ============================================================
// Question DTOs
// ============================================================

export class ModelExamQuestionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  questionNumber: number;

  @ApiProperty()
  question: string;

  @ApiProperty()
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };

  @ApiProperty()
  correctAnswer: string;

  @ApiProperty()
  difficulty: string;

  @ApiProperty()
  grade: number;

  @ApiProperty()
  unitTitle: string;

  @ApiPropertyOptional()
  subunitTitle?: string;

  @ApiProperty()
  shortExplanation: string;

  // Image support for diagram-based questions
  @ApiPropertyOptional({ description: 'Whether this question has a diagram image' })
  hasImage?: boolean;

  @ApiPropertyOptional({ description: 'URL to the diagram image' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Description of the diagram' })
  imageDescription?: string;
}

// ============================================================
// Model Exam Response DTOs
// ============================================================

export class ModelExamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  subjectTitle: string;

  @ApiProperty()
  basedOnYears: number[];

  @ApiProperty()
  duration: number;

  @ApiProperty()
  totalQuestions: number;

  @ApiProperty()
  generatedQuestionsCount: number;

  @ApiProperty()
  status: string;

  @ApiProperty({ enum: ['real', 'practice'] })
  examType: 'real' | 'practice';

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class ModelExamDetailResponseDto extends ModelExamResponseDto {
  @ApiPropertyOptional()
  blueprint?: BlueprintItemDto[];

  @ApiProperty({ type: [ModelExamQuestionDto] })
  questions: ModelExamQuestionDto[];
}

// ============================================================
// Publish/Unpublish DTOs
// ============================================================

export class PublishModelExamDto {
  @ApiProperty({ description: 'Model Exam ID to publish' })
  @IsString()
  modelExamId: string;
}

// ============================================================
// Student-Facing DTOs
// ============================================================

export class StudentExamListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subjectTitle: string;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  totalQuestions: number;

  @ApiProperty()
  basedOnYears: number[];

  @ApiProperty()
  gradeTitle: string;

  @ApiProperty({ enum: ['real', 'practice'] })
  examType: 'real' | 'practice';
}

export class StartModelExamDto {
  @ApiProperty()
  @IsString()
  modelExamId: string;
}

export class SubmitModelExamAnswerDto {
  @ApiProperty()
  @IsNumber()
  questionNumber: number;

  @ApiProperty({ enum: ['A', 'B', 'C', 'D'] })
  @IsEnum(['A', 'B', 'C', 'D'])
  answer: string;
}

export class SubmitModelExamDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty({ type: [SubmitModelExamAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitModelExamAnswerDto)
  answers: SubmitModelExamAnswerDto[];
}
