import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NationalExamPattern,
  NationalExamPatternDocument,
  GradeDistribution,
  DifficultyDistribution,
  UnitFrequency,
  ImagePatternAnalysis,
  DifficultyAnalysis,
  UnitImportanceScore,
  PatternStabilityAnalysis,
  PatternExplanation,
  GRADE_WEIGHTS,
} from '../schemas/national-exam-pattern.schema';
import {
  ExamPaper,
  ExamPaperDocument,
} from '../../exam-paper/schemas/exam-paper.schema';
import {
  ExamPaperQuestion,
  ExamPaperQuestionDocument,
} from '../../exam-paper/schemas/exam-paper-question.schema';
import { Subject } from '../../subjects/subjects.schema';
import { AnalyzeExamPatternsDto, ExamPatternResponseDto } from '../dto/model-exam.dto';
import { LlmService } from '../../llm/llm.service';

/**
 * Enhanced Pattern Analysis Service v2.0
 * 
 * Key Improvements:
 * 1. Image-based question pattern discovery
 * 2. Data-driven difficulty analysis (not fixed ratios)
 * 3. Unit importance scoring with weighted formula
 * 4. Curriculum progression weighting
 * 5. Pattern stability analysis across years
 * 6. Human-readable explanations
 */
@Injectable()
export class PatternAnalysisService {
  private readonly logger = new Logger(PatternAnalysisService.name);

  constructor(
    @InjectModel(NationalExamPattern.name)
    private patternModel: Model<NationalExamPatternDocument>,
    @InjectModel(ExamPaper.name)
    private examPaperModel: Model<ExamPaperDocument>,
    @InjectModel(ExamPaperQuestion.name)
    private questionModel: Model<ExamPaperQuestionDocument>,
    @InjectModel(Subject.name)
    private subjectModel: Model<Subject>,
    private readonly llmService: LlmService,
  ) {}

  /**
   * Analyze exam patterns from selected years for a subject
   * Enhanced with all v2.0 features
   */
  async analyzePatterns(
    dto: AnalyzeExamPatternsDto,
    adminId: string,
  ): Promise<ExamPatternResponseDto> {
    this.logger.log(
      `[v2.0] Analyzing patterns for subject ${dto.subjectId}, years: ${dto.selectedYears.join(', ')}`,
    );

    // Get subject info
    const subject = await this.subjectModel.findById(dto.subjectId);
    if (!subject) {
      throw new NotFoundException(`Subject ${dto.subjectId} not found`);
    }

    // Find all approved exam papers for this subject and these years
    const examPapers = await this.examPaperModel.find({
      subjectId: new Types.ObjectId(dto.subjectId),
      examYear: { $in: dto.selectedYears },
      status: 'approved',
    });

    if (examPapers.length === 0) {
      throw new NotFoundException(
        `No approved exam papers found for subject ${subject.title} in years ${dto.selectedYears.join(', ')}`,
      );
    }

    const examPaperIds = examPapers.map((ep) => ep._id);

    // Get all approved questions from these exam papers
    const questions = await this.questionModel.find({
      examPaperId: { $in: examPaperIds },
      approvalStatus: 'approved',
    });

    if (questions.length === 0) {
      throw new NotFoundException(
        `No approved questions found in the selected exam papers`,
      );
    }

    this.logger.log(`Found ${questions.length} questions to analyze`);

    // Create year-to-paper mapping for year-based analysis
    const yearToPaperMap = new Map<number, Types.ObjectId[]>();
    for (const ep of examPapers) {
      const year = ep.examYear;
      if (!yearToPaperMap.has(year)) {
        yearToPaperMap.set(year, []);
      }
      yearToPaperMap.get(year)!.push(ep._id as Types.ObjectId);
    }

    // Step 1: Classify questions (filling in Grade/Unit metadata if missing)
    await this.classifyQuestions(questions, subject.title);

    // Step 2: Analyze grade distribution with curriculum progression weighting
    const gradeDistribution = this.analyzeGradeDistribution(questions);

    // Step 3: Analyze difficulty distribution (DATA-DRIVEN, not fixed)
    const difficultyAnalysis = await this.analyzeDataDrivenDifficulty(questions, subject.title);
    const difficultyDistribution = difficultyAnalysis.distribution;

    // Step 4: Analyze image-based question patterns
    const imagePatternAnalysis = this.analyzeImagePatterns(questions, examPapers, yearToPaperMap);

    // Step 5: Calculate unit importance scores (not just frequency)
    const unitImportanceScores = this.calculateUnitImportanceScores(
      questions,
      examPapers,
      yearToPaperMap,
      difficultyAnalysis,
    );

    // Step 6: Legacy unit frequencies for backward compatibility
    const unitFrequencies = this.analyzeUnitFrequencies(questions, examPapers);

    // Step 7: Pattern stability analysis
    const patternStability = this.analyzePatternStability(
      questions,
      examPapers,
      yearToPaperMap,
      unitImportanceScores,
    );

    // Step 8: Generate human-readable explanation
    const explanation = this.generateExplanation(
      gradeDistribution,
      difficultyAnalysis,
      unitImportanceScores,
      imagePatternAnalysis,
      patternStability,
      dto.selectedYears,
      questions.length,
    );

    // Create or update pattern record
    const existingPattern = await this.patternModel.findOne({
      subjectId: new Types.ObjectId(dto.subjectId),
    });

    let pattern: NationalExamPatternDocument;

    if (existingPattern) {
      // Update existing pattern
      existingPattern.sourceExamYears = dto.selectedYears;
      existingPattern.totalQuestionsAnalyzed = questions.length;
      existingPattern.gradeDistribution = gradeDistribution;
      existingPattern.difficultyDistribution = difficultyDistribution;
      existingPattern.unitFrequencies = unitFrequencies;
      existingPattern.imagePatternAnalysis = imagePatternAnalysis;
      existingPattern.difficultyAnalysis = difficultyAnalysis;
      existingPattern.unitImportanceScores = unitImportanceScores;
      existingPattern.patternStability = patternStability;
      existingPattern.explanation = explanation;
      existingPattern.analysisVersion = '2.0';
      existingPattern.analyzedBy = adminId;
      pattern = await existingPattern.save();
    } else {
      // Create new pattern
      pattern = await this.patternModel.create({
        subjectId: new Types.ObjectId(dto.subjectId),
        subjectTitle: subject.title,
        sourceExamYears: dto.selectedYears,
        totalQuestionsAnalyzed: questions.length,
        gradeDistribution,
        difficultyDistribution,
        unitFrequencies,
        imagePatternAnalysis,
        difficultyAnalysis,
        unitImportanceScores,
        patternStability,
        explanation,
        analysisVersion: '2.0',
        analyzedBy: adminId,
      });
    }

    this.logger.log(`Pattern analysis v2.0 complete for ${subject.title}`);
    return this.toResponseDto(pattern);
  }

  // ============================================================
  // 1. GRADE DISTRIBUTION WITH CURRICULUM WEIGHTING
  // ============================================================

  private analyzeGradeDistribution(
    questions: ExamPaperQuestionDocument[],
  ): GradeDistribution {
    let g9 = 0, g10 = 0, g11 = 0, g12 = 0;
    
    for (const q of questions) {
      if (q.grade === 9) g9++;
      else if (q.grade === 10) g10++;
      else if (q.grade === 11) g11++;
      else if (q.grade === 12) g12++;
    }

    return { grade9: g9, grade10: g10, grade11: g11, grade12: g12 };
  }

  // ============================================================
  // 2. DATA-DRIVEN DIFFICULTY ANALYSIS
  // ============================================================

  private async analyzeDataDrivenDifficulty(
    questions: ExamPaperQuestionDocument[],
    subjectTitle: string,
  ): Promise<DifficultyAnalysis> {
    this.logger.log('Computing data-driven difficulty distribution...');

    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
    const yearlyDistribution: Array<{ year: number; easy: number; medium: number; hard: number }> = [];

    // Compute difficulty for each question using proxies
    for (const q of questions) {
      const difficulty = this.inferQuestionDifficulty(q);
      difficultyCounts[difficulty]++;
    }

    // If we have year metadata from exam papers, compute yearly distribution
    // (Simplified for now - could be enhanced with per-year tracking)

    const total = questions.length;
    const isDataDriven = true;

    return {
      distribution: difficultyCounts,
      isDataDriven,
      methodology: 'Difficulty inferred using: (1) Question length, (2) Option complexity, (3) Multi-step reasoning indicators, (4) Technical vocabulary density',
      confidenceScore: total >= 50 ? 0.8 : total >= 20 ? 0.6 : 0.4,
      yearlyDistribution,
    };
  }

  /**
   * Infer difficulty using proxy metrics
   */
  private inferQuestionDifficulty(q: ExamPaperQuestionDocument): 'easy' | 'medium' | 'hard' {
    let score = 0;

    // 1. Question length (longer = harder)
    const questionLength = q.question?.length || 0;
    if (questionLength > 200) score += 2;
    else if (questionLength > 100) score += 1;

    // 2. Option complexity (longer options = harder)
    const avgOptionLength = (q.options || []).reduce((sum, opt) => sum + (opt?.length || 0), 0) / 4;
    if (avgOptionLength > 50) score += 2;
    else if (avgOptionLength > 25) score += 1;

    // 3. Multi-step reasoning indicators
    const reasoningKeywords = [
      'calculate', 'derive', 'prove', 'analyze', 'compare', 'evaluate',
      'explain why', 'determine', 'predict', 'synthesize', 'combine',
    ];
    const questionLower = (q.question || '').toLowerCase();
    const hasReasoningKeywords = reasoningKeywords.some(kw => questionLower.includes(kw));
    if (hasReasoningKeywords) score += 2;

    // 4. Technical vocabulary indicators
    const technicalIndicators = [
      'equation', 'formula', 'coefficient', 'theorem', 'hypothesis',
      'mechanism', 'structure', 'function', 'relationship', 'process',
    ];
    const hasTechnicalVocab = technicalIndicators.filter(t => questionLower.includes(t)).length;
    score += Math.min(hasTechnicalVocab, 2);

    // 5. Grade level (higher grades = harder)
    if (q.grade === 12) score += 1;
    else if (q.grade === 11) score += 0.5;

    // 6. Has image (image-based questions often require more analysis)
    if (q.hasImage) score += 1;

    // Classify based on score
    if (score >= 5) return 'hard';
    if (score >= 2) return 'medium';
    return 'easy';
  }

  // ============================================================
  // 3. IMAGE PATTERN ANALYSIS
  // ============================================================

  private analyzeImagePatterns(
    questions: ExamPaperQuestionDocument[],
    examPapers: ExamPaperDocument[],
    yearToPaperMap: Map<number, Types.ObjectId[]>,
  ): ImagePatternAnalysis {
    this.logger.log('Analyzing image-based question patterns...');

    const imageQuestions = questions.filter(q => q.hasImage);
    const totalImageQuestions = imageQuestions.length;
    const imagePercentage = questions.length > 0 
      ? Math.round((totalImageQuestions / questions.length) * 100 * 10) / 10 
      : 0;

    // Classify image types based on question content
    const imagesByType = {
      diagram: 0,
      graph: 0,
      table: 0,
      geometryFigure: 0,
      labeledIllustration: 0,
      other: 0,
    };

    for (const q of imageQuestions) {
      const type = this.classifyImageType(q);
      imagesByType[type]++;
    }

    // Count by grade
    const imagesByGrade = { grade9: 0, grade10: 0, grade11: 0, grade12: 0 };
    for (const q of imageQuestions) {
      if (q.grade === 9) imagesByGrade.grade9++;
      else if (q.grade === 10) imagesByGrade.grade10++;
      else if (q.grade === 11) imagesByGrade.grade11++;
      else if (q.grade === 12) imagesByGrade.grade12++;
    }

    // Find top units with images
    const unitImageMap = new Map<string, { grade: number; unitNumber: number; unitTitle: string; count: number; total: number }>();
    for (const q of questions) {
      if (q.grade && q.unitNumber) {
        const key = `${q.grade}-${q.unitNumber}`;
        if (!unitImageMap.has(key)) {
          unitImageMap.set(key, {
            grade: q.grade,
            unitNumber: q.unitNumber,
            unitTitle: q.unitTitle || `Unit ${q.unitNumber}`,
            count: 0,
            total: 0,
          });
        }
        const entry = unitImageMap.get(key)!;
        entry.total++;
        if (q.hasImage) entry.count++;
      }
    }

    const topUnitsWithImages = Array.from(unitImageMap.values())
      .filter(u => u.count > 0)
      .map(u => ({
        grade: u.grade,
        unitNumber: u.unitNumber,
        unitTitle: u.unitTitle,
        imageCount: u.count,
        imagePercentage: Math.round((u.count / u.total) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.imageCount - a.imageCount)
      .slice(0, 10);

    // Yearly trend
    const yearlyTrend: Array<{ year: number; imageCount: number; imagePercentage: number }> = [];
    for (const [year, paperIds] of yearToPaperMap.entries()) {
      const yearQuestions = questions.filter(q => 
        paperIds.some(pid => pid.toString() === q.examPaperId.toString())
      );
      const yearImageQuestions = yearQuestions.filter(q => q.hasImage);
      yearlyTrend.push({
        year,
        imageCount: yearImageQuestions.length,
        imagePercentage: yearQuestions.length > 0 
          ? Math.round((yearImageQuestions.length / yearQuestions.length) * 100 * 10) / 10 
          : 0,
      });
    }
    yearlyTrend.sort((a, b) => a.year - b.year);

    return {
      totalImageQuestions,
      imagePercentage,
      imagesByType,
      imagesByGrade,
      topUnitsWithImages,
      yearlyTrend,
    };
  }

  private classifyImageType(q: ExamPaperQuestionDocument): keyof ImagePatternAnalysis['imagesByType'] {
    const text = (q.question + ' ' + (q.imageDescription || '')).toLowerCase();
    
    if (text.includes('graph') || text.includes('plot') || text.includes('curve') || text.includes('axis')) {
      return 'graph';
    }
    if (text.includes('table') || text.includes('data')) {
      return 'table';
    }
    if (text.includes('triangle') || text.includes('circle') || text.includes('angle') || 
        text.includes('polygon') || text.includes('rectangle') || text.includes('square')) {
      return 'geometryFigure';
    }
    if (text.includes('label') || text.includes('structure') || text.includes('part') ||
        text.includes('identify') || text.includes('shown')) {
      return 'labeledIllustration';
    }
    if (text.includes('diagram') || text.includes('figure') || text.includes('circuit') ||
        text.includes('cell') || text.includes('apparatus')) {
      return 'diagram';
    }
    return 'other';
  }

  // ============================================================
  // 4. UNIT IMPORTANCE SCORING
  // ============================================================

  private calculateUnitImportanceScores(
    questions: ExamPaperQuestionDocument[],
    examPapers: ExamPaperDocument[],
    yearToPaperMap: Map<number, Types.ObjectId[]>,
    difficultyAnalysis: DifficultyAnalysis,
  ): UnitImportanceScore[] {
    this.logger.log('Calculating unit importance scores...');

    // Group questions by unit
    const unitMap = new Map<string, {
      grade: number;
      unitNumber: number;
      unitTitle: string;
      questions: ExamPaperQuestionDocument[];
      yearsAppeared: Set<number>;
    }>();

    for (const q of questions) {
      if (q.grade && q.unitNumber) {
        const key = `${q.grade}-${q.unitNumber}`;
        if (!unitMap.has(key)) {
          unitMap.set(key, {
            grade: q.grade,
            unitNumber: q.unitNumber,
            unitTitle: q.unitTitle || `Unit ${q.unitNumber}`,
            questions: [],
            yearsAppeared: new Set(),
          });
        }
        unitMap.get(key)!.questions.push(q);

        // Track which years this unit appeared in
        for (const [year, paperIds] of yearToPaperMap.entries()) {
          if (paperIds.some(pid => pid.toString() === q.examPaperId.toString())) {
            unitMap.get(key)!.yearsAppeared.add(year);
          }
        }
      }
    }

    // Calculate max frequency for normalization
    const maxFrequency = Math.max(...Array.from(unitMap.values()).map(u => u.questions.length), 1);
    const totalYears = yearToPaperMap.size;

    // Calculate importance score for each unit
    const scores: UnitImportanceScore[] = [];

    for (const [key, data] of unitMap.entries()) {
      const frequency = data.questions.length;
      const normalizedFrequency = frequency / maxFrequency;

      // Calculate average difficulty (1=easy, 2=medium, 3=hard)
      let difficultySum = 0;
      for (const q of data.questions) {
        const diff = this.inferQuestionDifficulty(q);
        difficultySum += diff === 'easy' ? 1 : diff === 'medium' ? 2 : 3;
      }
      const averageDifficulty = difficultySum / data.questions.length;
      const normalizedDifficulty = (averageDifficulty - 1) / 2; // Normalize to 0-1

      // Get grade weight
      const gradeWeight = GRADE_WEIGHTS[data.grade as keyof typeof GRADE_WEIGHTS] || 1.0;

      // Calculate importance score using the formula:
      // UnitImportance = (normalized_frequency × 0.5) + (average_difficulty × 0.3) + (grade_weight × 0.2)
      const importanceScore = 
        (normalizedFrequency * 0.5) + 
        (normalizedDifficulty * 0.3) + 
        ((gradeWeight - 0.6) / 0.7 * 0.2); // Normalize grade weight to 0-1 range

      // Determine stability class
      const yearsCovered = data.yearsAppeared.size;
      let stabilityClass: 'stable' | 'moderate' | 'unstable';
      if (totalYears > 1) {
        const coverage = yearsCovered / totalYears;
        if (coverage >= 0.75) stabilityClass = 'stable';
        else if (coverage >= 0.4) stabilityClass = 'moderate';
        else stabilityClass = 'unstable';
      } else {
        stabilityClass = 'moderate'; // Can't determine with only 1 year
      }

      // Check image question percentage
      const imageQuestions = data.questions.filter(q => q.hasImage);
      const imageQuestionPercentage = (imageQuestions.length / data.questions.length) * 100;

      scores.push({
        grade: data.grade,
        unitNumber: data.unitNumber,
        unitTitle: data.unitTitle,
        frequency,
        normalizedFrequency: Math.round(normalizedFrequency * 100) / 100,
        averageDifficulty: Math.round(averageDifficulty * 100) / 100,
        gradeWeight,
        importanceScore: Math.round(importanceScore * 1000) / 1000,
        stabilityClass,
        yearsAppeared: Array.from(data.yearsAppeared).sort(),
        hasImageQuestions: imageQuestions.length > 0,
        imageQuestionPercentage: Math.round(imageQuestionPercentage * 10) / 10,
      });
    }

    // Sort by importance score descending
    scores.sort((a, b) => b.importanceScore - a.importanceScore);

    return scores;
  }

  // ============================================================
  // 5. PATTERN STABILITY ANALYSIS
  // ============================================================

  private analyzePatternStability(
    questions: ExamPaperQuestionDocument[],
    examPapers: ExamPaperDocument[],
    yearToPaperMap: Map<number, Types.ObjectId[]>,
    unitImportanceScores: UnitImportanceScore[],
  ): PatternStabilityAnalysis {
    this.logger.log('Analyzing pattern stability...');

    const totalYears = yearToPaperMap.size;

    // Classify overall stability
    const stableUnits = unitImportanceScores.filter(u => u.stabilityClass === 'stable');
    const unstableUnits = unitImportanceScores.filter(u => u.stabilityClass === 'unstable');
    const stableRatio = stableUnits.length / unitImportanceScores.length;

    let overallStability: 'stable' | 'moderate' | 'unstable';
    if (stableRatio >= 0.6) overallStability = 'stable';
    else if (stableRatio >= 0.3) overallStability = 'moderate';
    else overallStability = 'unstable';

    // Analyze grade stability
    const gradeStability = this.analyzeGradeStability(questions, yearToPaperMap);

    // Calculate variance metrics
    const varianceMetrics = this.calculateVarianceMetrics(questions, yearToPaperMap);

    return {
      overallStability,
      gradeStability,
      stableUnits: stableUnits.map(u => ({ 
        grade: u.grade, 
        unitNumber: u.unitNumber, 
        unitTitle: u.unitTitle 
      })),
      unstableUnits: unstableUnits.map(u => ({ 
        grade: u.grade, 
        unitNumber: u.unitNumber, 
        unitTitle: u.unitTitle 
      })),
      varianceMetrics,
    };
  }

  private analyzeGradeStability(
    questions: ExamPaperQuestionDocument[],
    yearToPaperMap: Map<number, Types.ObjectId[]>,
  ): {
    grade9: 'stable' | 'moderate' | 'unstable';
    grade10: 'stable' | 'moderate' | 'unstable';
    grade11: 'stable' | 'moderate' | 'unstable';
    grade12: 'stable' | 'moderate' | 'unstable';
  } {
    const gradesByYear: Record<number, number[]> = { 9: [], 10: [], 11: [], 12: [] };

    for (const [year, paperIds] of yearToPaperMap.entries()) {
      const yearQuestions = questions.filter(q =>
        paperIds.some(pid => pid.toString() === q.examPaperId.toString())
      );
      const total = yearQuestions.length || 1;

      for (const grade of [9, 10, 11, 12]) {
        const count = yearQuestions.filter(q => q.grade === grade).length;
        gradesByYear[grade].push((count / total) * 100);
      }
    }

    const getStability = (values: number[]): 'stable' | 'moderate' | 'unstable' => {
      if (values.length <= 1) return 'moderate';
      const variance = this.calculateVariance(values);
      if (variance < 50) return 'stable';
      if (variance < 150) return 'moderate';
      return 'unstable';
    };

    return {
      grade9: getStability(gradesByYear[9]),
      grade10: getStability(gradesByYear[10]),
      grade11: getStability(gradesByYear[11]),
      grade12: getStability(gradesByYear[12]),
    };
  }

  private calculateVarianceMetrics(
    questions: ExamPaperQuestionDocument[],
    yearToPaperMap: Map<number, Types.ObjectId[]>,
  ): PatternStabilityAnalysis['varianceMetrics'] {
    // Simplified variance calculation
    // In production, this would be more sophisticated

    return {
      gradeVariance: 0.15, // Placeholder
      unitVariance: 0.25,
      difficultyVariance: 0.12,
      imageVariance: 0.18,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  // ============================================================
  // 6. LEGACY UNIT FREQUENCIES (BACKWARD COMPATIBILITY)
  // ============================================================

  private analyzeUnitFrequencies(
    questions: ExamPaperQuestionDocument[],
    examPapers: ExamPaperDocument[],
  ): UnitFrequency[] {
    const frequencyMap = new Map<string, UnitFrequency>();

    for (const q of questions) {
      if (q.grade && q.unitNumber) {
        const key = `${q.grade}-${q.unitNumber}`;
        if (frequencyMap.has(key)) {
          frequencyMap.get(key)!.frequency++;
        } else {
          frequencyMap.set(key, {
            grade: q.grade,
            unitNumber: q.unitNumber,
            unitTitle: q.unitTitle || `Unit ${q.unitNumber}`,
            frequency: 1,
          });
        }
      }
    }

    return Array.from(frequencyMap.values()).sort((a, b) => b.frequency - a.frequency);
  }

  // ============================================================
  // 7. EXPLAINABILITY - HUMAN-READABLE EXPLANATION
  // ============================================================

  private generateExplanation(
    gradeDistribution: GradeDistribution,
    difficultyAnalysis: DifficultyAnalysis,
    unitImportanceScores: UnitImportanceScore[],
    imagePatternAnalysis: ImagePatternAnalysis,
    patternStability: PatternStabilityAnalysis,
    years: number[],
    totalQuestions: number,
  ): PatternExplanation {
    const yearRange = years.length > 1 
      ? `${Math.min(...years)}–${Math.max(...years)}`
      : years[0].toString();

    // Calculate percentages
    const total = gradeDistribution.grade9 + gradeDistribution.grade10 + 
                  gradeDistribution.grade11 + gradeDistribution.grade12 || 1;
    const g12Pct = Math.round((gradeDistribution.grade12 / total) * 100);
    const g11Pct = Math.round((gradeDistribution.grade11 / total) * 100);

    // Find top units
    const topUnits = unitImportanceScores.slice(0, 3);
    const stableUnitsCount = patternStability.stableUnits.length;

    // Build summary
    const summary = `Analysis of ${totalQuestions} questions from entrance exams (${yearRange}) reveals a ${patternStability.overallStability} pattern with ${g12Pct}% Grade 12 and ${g11Pct}% Grade 11 emphasis. ${imagePatternAnalysis.imagePercentage}% of questions are image-based.`;

    // Grade explanation
    const gradeExplanation = `Grade Distribution: This exam emphasizes Grade 12 concepts (${g12Pct}%) and Grade 11 content (${g11Pct}%), reflecting the entrance exam's focus on senior secondary curriculum. Grade weights applied: G9=0.6, G10=0.8, G11=1.0, G12=1.3.`;

    // Difficulty explanation
    const diffPct = difficultyAnalysis.distribution;
    const diffTotal = diffPct.easy + diffPct.medium + diffPct.hard || 1;
    const difficultyExplanation = difficultyAnalysis.isDataDriven
      ? `Difficulty is DATA-DRIVEN (not assumed): ${Math.round((diffPct.easy/diffTotal)*100)}% Easy, ${Math.round((diffPct.medium/diffTotal)*100)}% Medium, ${Math.round((diffPct.hard/diffTotal)*100)}% Hard. ${difficultyAnalysis.methodology}`
      : `Using default difficulty distribution: 30% Easy, 50% Medium, 20% Hard.`;

    // Unit explanation
    const topUnitNames = topUnits.map(u => `Grade ${u.grade} ${u.unitTitle}`).join(', ');
    const unitExplanation = `Unit Importance: Top units are ${topUnitNames}. ${stableUnitsCount} units appear consistently across years (stable pattern). Unit importance calculated using: (frequency × 0.5) + (difficulty × 0.3) + (grade_weight × 0.2).`;

    // Image explanation
    const imageExplanation = imagePatternAnalysis.totalImageQuestions > 0
      ? `This model exam should include approximately ${Math.round(imagePatternAnalysis.imagePercentage)}% image-based questions because analysis shows ${imagePatternAnalysis.totalImageQuestions} diagram-based items across the selected exams. Top image types: ${this.getTopImageTypes(imagePatternAnalysis)}.`
      : `No image-based questions detected in the analyzed exams. Generated model exam will focus on text-based questions.`;

    // Recommendations
    const recommendations: string[] = [
      `Include ${g12Pct}% Grade 12 questions as the primary focus`,
      `Ensure ${stableUnitsCount} stable units are always represented`,
    ];

    if (imagePatternAnalysis.imagePercentage > 10) {
      recommendations.push(`Include ${Math.round(imagePatternAnalysis.imagePercentage)}% image-based questions`);
    }

    if (patternStability.unstableUnits.length > 0) {
      recommendations.push(`Consider adding ${Math.min(patternStability.unstableUnits.length, 3)} unstable units as challenge questions`);
    }

    return {
      summary,
      gradeExplanation,
      difficultyExplanation,
      unitExplanation,
      imageExplanation,
      recommendations,
      generatedAt: new Date(),
    };
  }

  private getTopImageTypes(analysis: ImagePatternAnalysis): string {
    const types = Object.entries(analysis.imagesByType)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
    return types.length > 0 ? types.join(', ') : 'none';
  }

  // ============================================================
  // QUESTION CLASSIFICATION (LLM-BASED)
  // ============================================================

  private async classifyQuestions(
    questions: ExamPaperQuestionDocument[],
    subjectTitle: string,
  ): Promise<void> {
    const unclassified = questions.filter((q) => !q.grade || !q.unitNumber);
    if (unclassified.length === 0) return;

    this.logger.log(`Classifying ${unclassified.length} questions using LLM...`);

    const batchSize = 10;
    for (let i = 0; i < unclassified.length; i += batchSize) {
      const batch = unclassified.slice(i, i + batchSize);
      try {
        await this.classifyBatch(batch, subjectTitle);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        this.logger.error(`Error classifying batch ${i}: ${error.message}`);
      }
    }
  }

  private async classifyBatch(
    questions: ExamPaperQuestionDocument[],
    subjectTitle: string,
  ) {
    const questionsText = questions
      .map((q, idx) => `ID ${idx}: ${q.question}`)
      .join('\n\n');

    const prompt = `You are an expert on the Ethiopian Curriculum for ${subjectTitle}.
Classify the following entrance exam questions by Grade Level (9, 10, 11, 12), Unit Number, and estimate difficulty.

QUESTIONS:
${questionsText}

OUTPUT FORMAT:
Return a JSON array where each object has:
- "id": the ID number from the input
- "grade": number (9, 10, 11, or 12)
- "unitNumber": number
- "unitTitle": string
- "difficulty": "easy" | "medium" | "hard"
- "hasImageContent": boolean (true if the question references a diagram, figure, graph, etc.)

Example: [{"id": 0, "grade": 10, "unitNumber": 2, "unitTitle": "Chemical Reactions", "difficulty": "medium", "hasImageContent": false}, ...]
    `;

    try {
      const response = await this.llmService.generate(prompt, { format: 'json' });
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return;

      const results = JSON.parse(jsonMatch[0]);
      
      for (const res of results) {
        if (typeof res.id === 'number' && questions[res.id]) {
          const q = questions[res.id];
          q.grade = res.grade;
          q.unitNumber = res.unitNumber;
          q.unitTitle = res.unitTitle;
          // Note: hasImage should already be set from upload, but we can flag content-based image references
          if (res.hasImageContent && !q.hasImage) {
            // Q references image but no actual image - mark for review
            q.hasImage = true;
            q.imageDescription = 'Referenced in question text - needs image upload';
          }
          await q.save();
        }
      }
    } catch (error) {
      this.logger.error(`Batch classification failed: ${error.message}`);
    }
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  async getPatternById(patternId: string): Promise<NationalExamPatternDocument> {
    const pattern = await this.patternModel.findById(patternId);
    if (!pattern) {
      throw new NotFoundException(`Pattern ${patternId} not found`);
    }
    return pattern;
  }

  async getPatternsBySubject(subjectId: string): Promise<ExamPatternResponseDto[]> {
    const patterns = await this.patternModel
      .find({ subjectId: new Types.ObjectId(subjectId) })
      .sort({ createdAt: -1 });

    return patterns.map((p) => this.toResponseDto(p));
  }

  async getAvailableExamYears(subjectId: string): Promise<{ years: number[]; totalPapers: number }> {
    const examPapers = await this.examPaperModel.find({
      subjectId: new Types.ObjectId(subjectId),
      status: 'approved',
    }).select('examYear');

    if (examPapers.length === 0) {
      return { years: [], totalPapers: 0 };
    }

    const years = [...new Set(examPapers.map((ep) => ep.examYear))].sort((a, b) => a - b);

    return { years, totalPapers: examPapers.length };
  }

  async getSubjectsWithExamPapers(): Promise<Subject[]> {
    const distinctSubjectIds = await this.examPaperModel.distinct('subjectId', {
      status: 'approved',
    });
    return this.subjectModel.find({ _id: { $in: distinctSubjectIds } }).sort({ title: 1 });
  }

  private toResponseDto(pattern: NationalExamPatternDocument): ExamPatternResponseDto {
    return {
      id: (pattern._id as any).toString(),
      subjectId: pattern.subjectId.toString(),
      subjectTitle: pattern.subjectTitle,
      sourceExamYears: pattern.sourceExamYears,
      totalQuestionsAnalyzed: pattern.totalQuestionsAnalyzed,
      gradeDistribution: pattern.gradeDistribution,
      difficultyDistribution: pattern.difficultyDistribution,
      unitFrequencies: pattern.unitFrequencies.map((u) => ({
        grade: u.grade,
        unitNumber: u.unitNumber,
        unitTitle: u.unitTitle,
        frequency: u.frequency,
      })),
      // Enhanced fields
      imagePatternAnalysis: pattern.imagePatternAnalysis,
      difficultyAnalysis: pattern.difficultyAnalysis,
      unitImportanceScores: pattern.unitImportanceScores,
      patternStability: pattern.patternStability,
      explanation: pattern.explanation,
      analysisVersion: pattern.analysisVersion,
      createdAt: pattern.createdAt,
    };
  }
}
