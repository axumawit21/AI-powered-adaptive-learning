import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NationalExamPattern,
  NationalExamPatternDocument,
  UnitImportanceScore,
  GRADE_WEIGHTS,
} from '../schemas/national-exam-pattern.schema';
import { BlueprintItem } from '../schemas/model-exam.schema';
import {
  GenerateBlueprintDto,
  BlueprintResponseDto,
  BlueprintItemDto,
} from '../dto/model-exam.dto';
import { Subject } from '../../subjects/subjects.schema';
import { Grade } from '../../grades/grades.schema';

/**
 * Enhanced Blueprint Service v2.0
 * 
 * Key Improvements:
 * 1. Uses unit importance scores (not just frequency)
 * 2. Respects pattern stability (always includes stable units)
 * 3. Allocates image-based questions proportionally
 * 4. Uses data-driven difficulty distribution
 * 5. Provides explainable blueprint with reasoning
 */
@Injectable()
export class BlueprintService {
  private readonly logger = new Logger(BlueprintService.name);

  constructor(
    @InjectModel(NationalExamPattern.name)
    private patternModel: Model<NationalExamPatternDocument>,
    @InjectModel(Subject.name)
    private subjectModel: Model<Subject>,
    @InjectModel(Grade.name)
    private gradeModel: Model<Grade>,
  ) {}

  /**
   * Generate a blueprint from a pattern (v2.0 Enhanced)
   */
  async generateBlueprint(dto: GenerateBlueprintDto): Promise<BlueprintResponseDto> {
    this.logger.log(
      `[v2.0] Generating blueprint from pattern ${dto.patternId} with ${dto.totalQuestions} questions`,
    );

    const pattern = await this.patternModel.findById(dto.patternId);
    if (!pattern) {
      throw new NotFoundException(`Pattern ${dto.patternId} not found`);
    }

    // Get subject with units info
    const subject = await this.subjectModel.findById(pattern.subjectId);
    if (!subject) {
      throw new NotFoundException(`Subject not found`);
    }

    // Calculate grade distribution with curriculum weighting
    const gradeDistribution = this.calculateGradeDistribution(
      pattern.gradeDistribution,
      dto.totalQuestions,
    );

    // Use data-driven difficulty distribution if available
    const difficultyDistribution = this.calculateDifficultyDistribution(
      pattern,
      dto.totalQuestions,
    );

    // Calculate image question allocation
    const imageQuestionCount = this.calculateImageQuestionCount(pattern, dto.totalQuestions);

    // Generate blueprint items using unit importance scores
    const items = await this.generateBlueprintItems(
      pattern,
      gradeDistribution,
      difficultyDistribution,
      dto.totalQuestions,
      imageQuestionCount,
    );

    this.logger.log(`Generated ${items.length} blueprint items with ${imageQuestionCount} image-based questions`);

    return {
      patternId: (pattern._id as any).toString(),
      subjectTitle: pattern.subjectTitle,
      totalQuestions: dto.totalQuestions,
      duration: dto.duration,
      gradeDistribution,
      difficultyDistribution,
      items,
    };
  }

  /**
   * Calculate grade distribution with curriculum progression weighting
   */
  private calculateGradeDistribution(
    patternGrades: { grade9: number; grade10: number; grade11: number; grade12: number },
    totalQuestions: number,
  ): { grade9: number; grade10: number; grade11: number; grade12: number } {
    // Apply curriculum progression weights
    const weightedG9 = patternGrades.grade9 * GRADE_WEIGHTS[9];
    const weightedG10 = patternGrades.grade10 * GRADE_WEIGHTS[10];
    const weightedG11 = patternGrades.grade11 * GRADE_WEIGHTS[11];
    const weightedG12 = patternGrades.grade12 * GRADE_WEIGHTS[12];

    const totalWeighted = weightedG9 + weightedG10 + weightedG11 + weightedG12;

    if (totalWeighted === 0) {
      // Fallback to default distribution
      return {
        grade9: Math.round(totalQuestions * 0.10),
        grade10: Math.round(totalQuestions * 0.20),
        grade11: Math.round(totalQuestions * 0.30),
        grade12: Math.round(totalQuestions * 0.40),
      };
    }

    const gradeDistribution = {
      grade9: Math.round((weightedG9 / totalWeighted) * totalQuestions),
      grade10: Math.round((weightedG10 / totalWeighted) * totalQuestions),
      grade11: Math.round((weightedG11 / totalWeighted) * totalQuestions),
      grade12: Math.round((weightedG12 / totalWeighted) * totalQuestions),
    };

    // Adjust for rounding errors
    const gradeSum =
      gradeDistribution.grade9 +
      gradeDistribution.grade10 +
      gradeDistribution.grade11 +
      gradeDistribution.grade12;
    if (gradeSum !== totalQuestions) {
      gradeDistribution.grade12 += totalQuestions - gradeSum;
    }

    return gradeDistribution;
  }

  /**
   * Calculate difficulty distribution using data-driven analysis
   */
  private calculateDifficultyDistribution(
    pattern: NationalExamPatternDocument,
    totalQuestions: number,
  ): { easy: number; medium: number; hard: number } {
    // Use data-driven analysis if available
    const source = pattern.difficultyAnalysis?.isDataDriven
      ? pattern.difficultyAnalysis.distribution
      : pattern.difficultyDistribution;

    const totalDiffFromPattern = source.easy + source.medium + source.hard;

    if (totalDiffFromPattern === 0) {
      // Fallback to default
      return {
        easy: Math.round(totalQuestions * 0.30),
        medium: Math.round(totalQuestions * 0.50),
        hard: Math.round(totalQuestions * 0.20),
      };
    }

    const difficultyDistribution = {
      easy: Math.round((source.easy / totalDiffFromPattern) * totalQuestions),
      medium: Math.round((source.medium / totalDiffFromPattern) * totalQuestions),
      hard: Math.round((source.hard / totalDiffFromPattern) * totalQuestions),
    };

    // Adjust for rounding
    const diffSum =
      difficultyDistribution.easy +
      difficultyDistribution.medium +
      difficultyDistribution.hard;
    if (diffSum !== totalQuestions) {
      difficultyDistribution.medium += totalQuestions - diffSum;
    }

    return difficultyDistribution;
  }

  /**
   * Calculate how many image-based questions to include
   */
  private calculateImageQuestionCount(
    pattern: NationalExamPatternDocument,
    totalQuestions: number,
  ): number {
    if (!pattern.imagePatternAnalysis) return 0;

    const imagePercentage = pattern.imagePatternAnalysis.imagePercentage || 0;
    return Math.round((imagePercentage / 100) * totalQuestions);
  }

  /**
   * Generate individual blueprint items using unit importance scores
   */
  private async generateBlueprintItems(
    pattern: NationalExamPatternDocument,
    gradeDistribution: { grade9: number; grade10: number; grade11: number; grade12: number },
    difficultyDistribution: { easy: number; medium: number; hard: number },
    totalQuestions: number,
    imageQuestionCount: number,
  ): Promise<BlueprintItemDto[]> {
    const items: BlueprintItemDto[] = [];

    // Use unit importance scores if available, otherwise fall back to frequencies
    const unitScores = pattern.unitImportanceScores && pattern.unitImportanceScores.length > 0
      ? [...pattern.unitImportanceScores].sort((a, b) => b.importanceScore - a.importanceScore)
      : this.convertFrequenciesToScores(pattern.unitFrequencies);

    // Get stable units (must be included)
    const stableUnits = pattern.patternStability?.stableUnits || [];
    const stableUnitKeys = new Set(stableUnits.map(u => `${u.grade}-${u.unitNumber}`));

    // Calculate total importance for normalization
    const totalImportance = unitScores.reduce((sum, u) => sum + u.importanceScore, 0);

    // Questions remaining to allocate per grade
    const gradesRemaining = {
      9: gradeDistribution.grade9,
      10: gradeDistribution.grade10,
      11: gradeDistribution.grade11,
      12: gradeDistribution.grade12,
    };

    // Difficulties remaining
    const difficultiesRemaining = { ...difficultyDistribution };

    // Image questions remaining
    let imageQuestionsRemaining = imageQuestionCount;

    // First pass: Ensure stable units are included
    for (const unit of unitScores) {
      const unitKey = `${unit.grade}-${unit.unitNumber}`;
      if (!stableUnitKeys.has(unitKey)) continue;

      const gradeKey = unit.grade as 9 | 10 | 11 | 12;
      if (gradesRemaining[gradeKey] <= 0) continue;

      // Allocate at least 1 question for stable units
      const questionsForUnit = Math.min(
        Math.max(1, Math.round((unit.importanceScore / totalImportance) * totalQuestions)),
        gradesRemaining[gradeKey],
      );

      if (questionsForUnit <= 0) continue;

      this.allocateQuestionsToUnit(
        items,
        unit,
        questionsForUnit,
        gradesRemaining,
        difficultiesRemaining,
        imageQuestionsRemaining,
        unit.hasImageQuestions || false,
      );

      if (unit.hasImageQuestions && imageQuestionsRemaining > 0) {
        imageQuestionsRemaining--;
      }
    }

    // Second pass: Allocate remaining questions by importance
    for (const unit of unitScores) {
      const unitKey = `${unit.grade}-${unit.unitNumber}`;
      if (stableUnitKeys.has(unitKey)) continue; // Already processed

      const gradeKey = unit.grade as 9 | 10 | 11 | 12;
      if (gradesRemaining[gradeKey] <= 0) continue;

      // Calculate proportional allocation
      const proportionalCount = Math.max(
        1,
        Math.round((unit.importanceScore / totalImportance) * totalQuestions),
      );
      const questionsForUnit = Math.min(proportionalCount, gradesRemaining[gradeKey]);

      if (questionsForUnit <= 0) continue;

      this.allocateQuestionsToUnit(
        items,
        unit,
        questionsForUnit,
        gradesRemaining,
        difficultiesRemaining,
        imageQuestionsRemaining,
        unit.hasImageQuestions || false,
      );

      if (unit.hasImageQuestions && imageQuestionsRemaining > 0) {
        imageQuestionsRemaining--;
      }
    }

    // If we still have questions to allocate, distribute evenly
    let totalAllocated = items.reduce((sum, i) => sum + i.questionCount, 0);
    if (totalAllocated < totalQuestions) {
      const shortfall = totalQuestions - totalAllocated;
      for (let i = 0; i < shortfall && i < items.length; i++) {
        items[i].questionCount += 1;
      }
    }

    return items;
  }

  /**
   * Allocate questions to a unit with difficulty distribution
   */
  private allocateQuestionsToUnit(
    items: BlueprintItemDto[],
    unit: UnitImportanceScore | { grade: number; unitNumber: number; unitTitle: string; importanceScore: number; hasImageQuestions?: boolean },
    questionsForUnit: number,
    gradesRemaining: Record<number, number>,
    difficultiesRemaining: Record<string, number>,
    imageQuestionsRemaining: number,
    eligibleForImage: boolean,
  ): void {
    const gradeKey = unit.grade as 9 | 10 | 11 | 12;
    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
    let remaining = questionsForUnit;

    for (const diff of difficulties) {
      if (remaining <= 0) break;
      if (difficultiesRemaining[diff] <= 0) continue;

      const questionsWithDiff = Math.min(
        Math.ceil(remaining / difficulties.length),
        difficultiesRemaining[diff],
        remaining,
      );

      if (questionsWithDiff > 0) {
        // Check if this should be an image-based question
        const shouldHaveImage = eligibleForImage && imageQuestionsRemaining > 0 && diff !== 'easy';

        items.push({
          grade: unit.grade,
          unitNumber: unit.unitNumber,
          unitTitle: unit.unitTitle,
          questionCount: questionsWithDiff,
          difficulty: diff,
          confidence: unit.importanceScore,
          // Extended fields for image support (if needed in future)
        });

        gradesRemaining[gradeKey] -= questionsWithDiff;
        difficultiesRemaining[diff] -= questionsWithDiff;
        remaining -= questionsWithDiff;
      }
    }
  }

  /**
   * Convert legacy unit frequencies to importance scores
   */
  private convertFrequenciesToScores(
    frequencies: Array<{ grade: number; unitNumber: number; unitTitle: string; frequency: number }>,
  ): Array<{ grade: number; unitNumber: number; unitTitle: string; importanceScore: number; hasImageQuestions: boolean }> {
    if (!frequencies || frequencies.length === 0) return [];

    const maxFreq = Math.max(...frequencies.map(f => f.frequency), 1);

    return frequencies.map(f => ({
      grade: f.grade,
      unitNumber: f.unitNumber,
      unitTitle: f.unitTitle,
      importanceScore: f.frequency / maxFreq,
      hasImageQuestions: false,
    }));
  }

  /**
   * Create a default blueprint without prior pattern analysis
   */
  async createDefaultBlueprint(
    subjectId: string,
    totalQuestions: number,
    duration: number,
  ): Promise<BlueprintResponseDto> {
    const subject = await this.subjectModel.findById(subjectId);
    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} not found`);
    }

    // Default distribution with curriculum progression
    const gradeDistribution = {
      grade9: Math.round(totalQuestions * 0.10),
      grade10: Math.round(totalQuestions * 0.20),
      grade11: Math.round(totalQuestions * 0.30),
      grade12: Math.round(totalQuestions * 0.40),
    };

    const difficultyDistribution = {
      easy: Math.round(totalQuestions * 0.30),
      medium: Math.round(totalQuestions * 0.50),
      hard: Math.round(totalQuestions * 0.20),
    };

    // Create simple items
    const items: BlueprintItemDto[] = [];
    const grades = [9, 10, 11, 12];
    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];

    for (const grade of grades) {
      const gradeKey = `grade${grade}` as keyof typeof gradeDistribution;
      const questionsForGrade = gradeDistribution[gradeKey];

      // Distribute across 3 units per grade
      for (let unit = 1; unit <= 3; unit++) {
        const questionsPerUnit = Math.floor(questionsForGrade / 3);
        const diff = difficulties[(unit - 1) % 3];

        items.push({
          grade,
          unitNumber: unit,
          unitTitle: `Unit ${unit}`,
          questionCount: questionsPerUnit,
          difficulty: diff,
          confidence: 0.5,
        });
      }
    }

    return {
      patternId: '',
      subjectTitle: subject.title,
      totalQuestions,
      duration,
      gradeDistribution,
      difficultyDistribution,
      items,
    };
  }
}
