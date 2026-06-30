import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ModelExam,
  ModelExamDocument,
  BlueprintItem,
} from '../schemas/model-exam.schema';
import {
  ModelExamQuestion,
  ModelExamQuestionDocument,
} from '../schemas/model-exam-question.schema';
import { Subject } from '../../subjects/subjects.schema';
import { PatternAnalysisService } from './pattern-analysis.service';
import { BlueprintService } from './blueprint.service';
import { QuestionGeneratorService } from './question-generator.service';
import {
  CreateModelExamDto,
  GenerateModelExamQuestionsDto,
  ModelExamResponseDto,
  ModelExamDetailResponseDto,
  StudentExamListItemDto,
} from '../dto/model-exam.dto';

/**
 * Main orchestration service for model exam operations.
 */
@Injectable()
export class ModelExamService {
  private readonly logger = new Logger(ModelExamService.name);

  constructor(
    @InjectModel(ModelExam.name)
    private modelExamModel: Model<ModelExamDocument>,
    @InjectModel(ModelExamQuestion.name)
    private questionModel: Model<ModelExamQuestionDocument>,
    @InjectModel(Subject.name)
    private subjectModel: Model<Subject>,
    private readonly patternService: PatternAnalysisService,
    private readonly blueprintService: BlueprintService,
    private readonly questionGeneratorService: QuestionGeneratorService,
  ) {}

  /**
   * Create a new model exam (draft)
   */
  async createModelExam(
    dto: CreateModelExamDto,
    adminId: string,
  ): Promise<ModelExamResponseDto> {
    this.logger.log(`Creating model exam: ${dto.title}`);

    const subject = await this.subjectModel.findById(dto.subjectId);
    if (!subject) {
      throw new NotFoundException(`Subject ${dto.subjectId} not found`);
    }

    // Blueprint MUST come from real pattern analysis of entrance exams
    let blueprint: BlueprintItem[] = (dto.blueprint as BlueprintItem[]) || [];

    if (blueprint.length === 0) {
      if (!dto.patternId) {
        throw new BadRequestException(
          'Pattern ID is required. Please first analyze entrance exam papers to create a pattern, then use that pattern to generate the blueprint.',
        );
      }
      // Generate blueprint from analyzed pattern
      const blueprintResponse = await this.blueprintService.generateBlueprint({
        patternId: dto.patternId,
        totalQuestions: dto.totalQuestions,
        duration: dto.duration,
      });
      blueprint = blueprintResponse.items as BlueprintItem[];
      this.logger.log(`Generated blueprint from pattern ${dto.patternId} with ${blueprint.length} items`);
    }

    const modelExam = await this.modelExamModel.create({
      title: dto.title,
      subjectId: new Types.ObjectId(dto.subjectId),
      subjectTitle: subject.title,
      patternId: dto.patternId ? new Types.ObjectId(dto.patternId) : undefined,
      basedOnYears: dto.basedOnYears,
      gradeId: dto.gradeId ? new Types.ObjectId(dto.gradeId) : undefined,
      gradeTitle: dto.gradeTitle || 'Grade 12',
      duration: dto.duration,
      totalQuestions: dto.totalQuestions,
      blueprint,
      status: 'draft',
      examType: dto.examType,
      createdBy: adminId,
      description: dto.description,
    });

    return this.toResponseDto(modelExam);
  }

  /**
   * Generate questions for a model exam
   */
  async generateQuestions(
    dto: GenerateModelExamQuestionsDto,
    adminId: string,
  ): Promise<ModelExamDetailResponseDto> {
    this.logger.log(`Generating questions for exam ${dto.modelExamId}`);

    const modelExam = await this.modelExamModel.findById(dto.modelExamId);
    if (!modelExam) {
      throw new NotFoundException(`Model exam ${dto.modelExamId} not found`);
    }

    if (modelExam.status === 'published') {
      throw new BadRequestException('Cannot regenerate questions for a published exam');
    }

    // Delete existing questions if regenerating
    if (dto.regenerate) {
      await this.questionGeneratorService.deleteQuestionsForExam(dto.modelExamId);
    }

    // Check if questions already exist
    const existingQuestions = await this.questionModel.countDocuments({
      modelExamId: new Types.ObjectId(dto.modelExamId),
    });

    if (existingQuestions > 0 && !dto.regenerate) {
      throw new BadRequestException(
        'Questions already exist. Set regenerate=true to replace them.',
      );
    }

    // Generate questions using blueprint
    const blueprint = modelExam.blueprint || [];
    if (blueprint.length === 0) {
      throw new BadRequestException('Model exam has no blueprint');
    }

    const generatedQuestions =
      await this.questionGeneratorService.generateQuestionsForBlueprint(
        dto.modelExamId,
        modelExam.subjectId.toString(),
        blueprint,
        [],
        (modelExam as any).examType || 'practice',
      );

    // Update exam with generated count
    modelExam.generatedQuestionsCount = generatedQuestions.length;
    await modelExam.save();

    return this.toDetailResponseDto(modelExam, generatedQuestions);
  }

  /**
   * Publish a model exam (make available to students)
   */
  async publishExam(examId: string, adminId: string): Promise<ModelExamResponseDto> {
    const modelExam = await this.modelExamModel.findById(examId);
    if (!modelExam) {
      throw new NotFoundException(`Model exam ${examId} not found`);
    }

    if (modelExam.generatedQuestionsCount === 0) {
      throw new BadRequestException('Cannot publish exam with no questions');
    }

    modelExam.status = 'published';
    modelExam.publishedAt = new Date();
    modelExam.publishedBy = adminId;
    await modelExam.save();

    this.logger.log(`Published model exam ${examId}`);

    return this.toResponseDto(modelExam);
  }

  /**
   * Unpublish a model exam
   */
  async unpublishExam(examId: string): Promise<ModelExamResponseDto> {
    const modelExam = await this.modelExamModel.findById(examId);
    if (!modelExam) {
      throw new NotFoundException(`Model exam ${examId} not found`);
    }

    modelExam.status = 'draft';
    modelExam.publishedAt = undefined;
    modelExam.publishedBy = undefined;
    await modelExam.save();

    return this.toResponseDto(modelExam);
  }

  /**
   * Archive a model exam
   */
  async archiveExam(examId: string): Promise<ModelExamResponseDto> {
    const modelExam = await this.modelExamModel.findById(examId);
    if (!modelExam) {
      throw new NotFoundException(`Model exam ${examId} not found`);
    }

    modelExam.status = 'archived';
    await modelExam.save();

    return this.toResponseDto(modelExam);
  }

  /**
   * Delete a draft model exam
   */
  async deleteExam(examId: string): Promise<void> {
    const modelExam = await this.modelExamModel.findById(examId);
    if (!modelExam) {
      throw new NotFoundException(`Model exam ${examId} not found`);
    }

    if (modelExam.status === 'published') {
      throw new BadRequestException('Cannot delete a published exam. Archive it first.');
    }

    // Delete associated questions
    await this.questionGeneratorService.deleteQuestionsForExam(examId);

    // Delete exam
    await this.modelExamModel.deleteOne({ _id: new Types.ObjectId(examId) });

    this.logger.log(`Deleted model exam ${examId}`);
  }

  /**
   * List all model exams (for admin)
   */
  async listModelExams(filters?: {
    subjectId?: string;
    status?: string;
  }): Promise<ModelExamResponseDto[]> {
    const query: any = {};

    if (filters?.subjectId) {
      query.subjectId = new Types.ObjectId(filters.subjectId);
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    const exams = await this.modelExamModel.find(query).sort({ createdAt: -1 });

    // Sync generatedQuestionsCount for draft exams (handles interrupted generation)
    for (const exam of exams) {
      if (exam.status === 'draft') {
        const actualCount = await this.questionModel.countDocuments({
          modelExamId: exam._id,
        });
        if (exam.generatedQuestionsCount !== actualCount) {
          this.logger.log(`Syncing count for exam ${exam._id}: ${exam.generatedQuestionsCount} -> ${actualCount}`);
          exam.generatedQuestionsCount = actualCount;
          await exam.save();
        }
      }
    }

    return exams.map((e) => this.toResponseDto(e));
  }

  /**
   * Get model exam by ID with questions
   */
  async getModelExamById(examId: string): Promise<ModelExamDetailResponseDto> {
    const modelExam = await this.modelExamModel.findById(examId);
    if (!modelExam) {
      throw new NotFoundException(`Model exam ${examId} not found`);
    }

    const questions = await this.questionGeneratorService.getQuestionsForExam(examId);

    // Auto-sync generatedQuestionsCount if it doesn't match actual count
    // This handles cases where generation was interrupted
    if (modelExam.generatedQuestionsCount !== questions.length) {
      this.logger.log(`Syncing generatedQuestionsCount for exam ${examId}: ${modelExam.generatedQuestionsCount} -> ${questions.length}`);
      modelExam.generatedQuestionsCount = questions.length;
      await modelExam.save();
    }

    return this.toDetailResponseDto(modelExam, questions);
  }

  // ============================================================
  // Student-Facing Methods
  // ============================================================

  /**
   * Get published exams for students
   */
  async getPublishedExamsForStudent(filters?: {
    subjectId?: string;
  }): Promise<StudentExamListItemDto[]> {
    const query: any = { status: 'published' };

    if (filters?.subjectId) {
      query.subjectId = new Types.ObjectId(filters.subjectId);
    }

    const exams = await this.modelExamModel.find(query).sort({ publishedAt: -1 });

    return exams.map((e) => ({
      id: (e._id as any).toString(),
      title: e.title,
      subjectTitle: e.subjectTitle,
      duration: e.duration,
      totalQuestions: e.totalQuestions,
      basedOnYears: e.basedOnYears,
      gradeTitle: e.gradeTitle || 'Grade 12',
      examType: (e as any).examType || 'practice',
    }));
  }

  /**
   * Start an exam session for a student
   */
  async startExamForStudent(
    studentId: string,
    examId: string,
  ): Promise<{
    examId: string;
    title: string;
    duration: number;
    examType: string;
    questions: any[];
  }> {
    const modelExam = await this.modelExamModel.findById(examId);
    if (!modelExam) {
      throw new NotFoundException(`Model exam ${examId} not found`);
    }

    if (modelExam.status !== 'published') {
      throw new BadRequestException('This exam is not available');
    }

    const questions = await this.questionModel
      .find({ modelExamId: new Types.ObjectId(examId) })
      .sort({ questionNumber: 1 });

    // Return questions for students (include answer for client-side scoring)
    return {
      examId: (modelExam._id as any).toString(),
      title: modelExam.title,
      duration: modelExam.duration,
      examType: (modelExam as any).examType || 'practice',
      questions: questions.map((q) => ({
        questionNumber: q.questionNumber,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer, // Needed for client-side scoring
        difficulty: q.difficulty,
        grade: q.grade,
        unitTitle: q.unitTitle,
        hint: q.hint,
        explanation: q.shortExplanation,
        // Image fields for diagram-based questions
        hasImage: (q as any).hasImage || false,
        imageUrl: (q as any).imageUrl || null,
        imageDescription: (q as any).imageDescription || null,
      })),
    };
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private toResponseDto(exam: ModelExamDocument): ModelExamResponseDto {
    return {
      id: (exam._id as any).toString(),
      title: exam.title,
      subjectId: exam.subjectId.toString(),
      subjectTitle: exam.subjectTitle,
      basedOnYears: exam.basedOnYears,
      duration: exam.duration,
      totalQuestions: exam.totalQuestions,
      generatedQuestionsCount: exam.generatedQuestionsCount,
      status: exam.status,
      examType: (exam as any).examType || 'practice',
      publishedAt: exam.publishedAt,
      createdAt: exam.createdAt,
    };
  }

  private toDetailResponseDto(
    exam: ModelExamDocument,
    questions: ModelExamQuestionDocument[],
  ): ModelExamDetailResponseDto {
    return {
      ...this.toResponseDto(exam),
      blueprint: exam.blueprint,
      questions: questions.map((q) => ({
        id: (q._id as any).toString(),
        questionNumber: q.questionNumber,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty,
        grade: q.grade,
        unitTitle: q.unitTitle,
        subunitTitle: q.subunitTitle,
        shortExplanation: q.shortExplanation,
        // Image fields for diagram-based questions
        hasImage: (q as any).hasImage || false,
        imageUrl: (q as any).imageUrl || null,
        imageDescription: (q as any).imageDescription || null,
      })),
    };
  }
}
