import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Stores analyzed patterns from real entrance exams.
 * Used to inform model exam blueprint generation.
 * 
 * Enhanced with:
 * - Image-based question pattern analysis
 * - Data-driven difficulty distribution
 * - Unit importance scoring
 * - Pattern stability analysis
 * - Explainability metadata
 */

export interface GradeDistribution {
  grade9: number;
  grade10: number;
  grade11: number;
  grade12: number;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface CognitiveDistribution {
  recall: number;
  understanding: number;
  application: number;
  analysis: number;
}

// Enhanced: Image-based question analysis
export interface ImagePatternAnalysis {
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
}

// Enhanced: Data-driven difficulty analysis
export interface DifficultyAnalysis {
  distribution: DifficultyDistribution;
  isDataDriven: boolean; // true if computed from proxies, false if using defaults
  methodology: string; // Description of how difficulty was computed
  confidenceScore: number; // 0-1 confidence in the analysis
  yearlyDistribution: Array<{
    year: number;
    easy: number;
    medium: number;
    hard: number;
  }>;
}

// Enhanced: Unit importance scoring
export interface UnitImportanceScore {
  grade: number;
  unitNumber: number;
  unitTitle: string;
  frequency: number;
  normalizedFrequency: number; // 0-1
  averageDifficulty: number; // 1-3 (easy=1, medium=2, hard=3)
  gradeWeight: number; // Grade progression weight
  importanceScore: number; // Computed score
  stabilityClass: 'stable' | 'moderate' | 'unstable';
  yearsAppeared: number[];
  hasImageQuestions: boolean;
  imageQuestionPercentage: number;
  subunits?: {
    subunitNumber: string;
    subunitTitle: string;
    frequency: number;
    importanceScore: number;
  }[];
}

// Legacy interface for backward compatibility
export interface UnitFrequency {
  grade: number;
  unitNumber: number;
  unitTitle: string;
  frequency: number;
  subunits?: {
    subunitNumber: string;
    subunitTitle: string;
    frequency: number;
  }[];
}

// Enhanced: Pattern stability analysis
export interface PatternStabilityAnalysis {
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
}

// Enhanced: Explainability metadata
export interface PatternExplanation {
  summary: string;
  gradeExplanation: string;
  difficultyExplanation: string;
  unitExplanation: string;
  imageExplanation: string;
  recommendations: string[];
  generatedAt: Date;
}

// Grade progression weights
export const GRADE_WEIGHTS = {
  9: 0.6,
  10: 0.8,
  11: 1.0,
  12: 1.3,
};

@Schema({ timestamps: true })
export class NationalExamPattern extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ required: true })
  subjectTitle: string;

  @Prop({ type: [Number], required: true })
  sourceExamYears: number[]; // e.g., [2020, 2022, 2023]

  @Prop({ type: Number, required: true })
  totalQuestionsAnalyzed: number;

  @Prop({ type: Object, required: true })
  gradeDistribution: GradeDistribution;

  @Prop({ type: Object, required: true })
  difficultyDistribution: DifficultyDistribution;

  @Prop({ type: Object })
  cognitiveDistribution?: CognitiveDistribution;

  @Prop({ type: [Object], required: true })
  unitFrequencies: UnitFrequency[];

  @Prop({ type: [String] })
  commonTopics?: string[];

  // ============================================================
  // ENHANCED FIELDS
  // ============================================================

  // Image-based question pattern analysis
  @Prop({ type: Object })
  imagePatternAnalysis?: ImagePatternAnalysis;

  // Data-driven difficulty analysis
  @Prop({ type: Object })
  difficultyAnalysis?: DifficultyAnalysis;

  // Unit importance scores (replaces simple frequencies)
  @Prop({ type: [Object] })
  unitImportanceScores?: UnitImportanceScore[];

  // Pattern stability analysis
  @Prop({ type: Object })
  patternStability?: PatternStabilityAnalysis;

  // Human-readable explanation
  @Prop({ type: Object })
  explanation?: PatternExplanation;

  // Analysis version for tracking upgrades
  @Prop({ default: '2.0' })
  analysisVersion: string;

  @Prop()
  analysisNotes?: string;

  @Prop({ required: true })
  analyzedBy: string;

  createdAt: Date;
  updatedAt: Date;
}

export const NationalExamPatternSchema = SchemaFactory.createForClass(NationalExamPattern);

// Index for efficient querying
NationalExamPatternSchema.index({ subjectId: 1, sourceExamYears: 1 });

export type NationalExamPatternDocument = NationalExamPattern & Document;
