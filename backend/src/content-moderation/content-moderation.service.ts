import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question, QuestionDocument } from '../question-bank/schemas/question.schema';
import { Summary, SummaryDocument } from '../summary/schemas/summary.schema';
import { Presentation, PresentationDocument } from '../presentation/schemas/presentation.schema';
import { Quiz } from '../quiz/quiz.schema';
import { ModelExam, ModelExamDocument } from '../national-exam/schemas/model-exam.schema';
import { TeacherUser, TeacherUserDocument } from '../teacher/teacher-user.schema';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import {
  QueryContentDto,
  ModerateContentDto,
  ContentType,
  ContentStatsDto,
} from './dto/content-moderation.dto';

@Injectable()
export class ContentModerationService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(Summary.name) private summaryModel: Model<SummaryDocument>,
    @InjectModel(Presentation.name) private presentationModel: Model<PresentationDocument>,
    @InjectModel(Quiz.name) private quizModel: Model<any>,
    @InjectModel(ModelExam.name) private modelExamModel: Model<ModelExamDocument>,
    @InjectModel(TeacherUser.name) private teacherModel: Model<TeacherUserDocument>,
    @InjectModel(Grade.name) private gradeModel: Model<any>,
    @InjectModel(Subject.name) private subjectModel: Model<any>,
  ) {}

  /**
   * Helper: resolve teacher's grade/subject titles from their DB record
   */
  private async resolveTeacherContext(teacherId: string): Promise<{ gradeTitle?: string; subjectTitle?: string; gradeId?: any; subjectId?: any } | null> {
    const teacher = await this.teacherModel.findById(teacherId).lean();
    if (!teacher || !teacher.gradeId || !teacher.subjectId) return null;

    const [grade, subject] = await Promise.all([
      this.gradeModel.findById(teacher.gradeId).lean(),
      this.subjectModel.findById(teacher.subjectId).lean(),
    ]);

    return {
      gradeTitle: (grade as any)?.title,
      subjectTitle: (subject as any)?.title,
      gradeId: teacher.gradeId,
      subjectId: teacher.subjectId,
    };
  }

  private getModel(type: ContentType): Model<any> {
    switch (type) {
      case 'question':
        return this.questionModel;
      case 'summary':
        return this.summaryModel;
      case 'presentation':
        return this.presentationModel;
      case 'quiz':
        return this.quizModel;
      case 'model_exam':
        return this.modelExamModel;
      default:
        throw new BadRequestException(`Unknown content type: ${type}`);
    }
  }

  async findAll(query: QueryContentDto) {
    const { status, type, grade, subject, unit, difficulty, search, questionType, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // If specific type requested, query only that model
    if (type) {
      return this.queryModel(type, { status, grade, subject, unit, difficulty, search, questionType }, skip, limit);
    }

    // Query all models and combine results
    const [questions, summaries, presentations, quizzes, modelExams] = await Promise.all([
      this.queryModel('question', { status, grade, subject, unit, difficulty, search, questionType }, 0, 1000),
      this.queryModel('summary', { status, grade, subject, unit, search }, 0, 1000),
      this.queryModel('presentation', { status, grade, subject, unit, search }, 0, 1000),
      this.queryModel('quiz', { status, grade, subject, unit, search }, 0, 1000),
      this.queryModel('model_exam', { status, grade, subject, unit, search }, 0, 1000),
    ]);

    // Combine and sort by updatedAt
    const allItems = [
      ...questions.items.map(item => ({ ...item, type: 'question' as const })),
      ...summaries.items.map(item => ({ ...item, type: 'summary' as const })),
      ...presentations.items.map(item => ({ ...item, type: 'presentation' as const })),
      ...quizzes.items.map(item => ({ ...item, type: 'quiz' as const })),
      ...modelExams.items.map(item => ({ ...item, type: 'model_exam' as const })),
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = allItems.length;
    const paginatedItems = allItems.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async queryModel(
    type: ContentType,
    filters: { status?: string; subject?: string; grade?: string; unit?: string; difficulty?: string; search?: string; questionType?: string },
    skip: number,
    limit: number,
  ) {
    const model = this.getModel(type);
    const query: any = {};
    const andConditions: any[] = [];

    // Handle status filter - treat documents without status as 'pending'
    if (filters.status) {
      if (filters.status === 'pending') {
        andConditions.push({
          $or: [
            { status: 'pending' },
            { status: { $exists: false } }
          ]
        });
      } else {
        query.status = filters.status;
      }
    }
    if (filters.subject) {
      // Handle different field names across schemas
      if (type === 'question') {
        query.subjectTitle = { $regex: filters.subject, $options: 'i' };
      } else {
        query.subject = { $regex: filters.subject, $options: 'i' };
      }
    }
    if (filters.grade) {
      // Handle different field names across schemas
      if (type === 'question') {
        query.gradeTitle = { $regex: filters.grade, $options: 'i' };
      } else {
        query.grade = { $regex: filters.grade, $options: 'i' };
      }
    }
    if (filters.unit) {
      if (type === 'question') {
        query.unitTitle = { $regex: filters.unit, $options: 'i' };
      } else {
        query.unit = { $regex: filters.unit, $options: 'i' };
      }
    }
    if (filters.questionType) {
      if (type === 'question') {
        query.type = filters.questionType;
      }
      // Quiz stores questions in an array, making it complex to filter by type at the quiz level, skipping for now or handle if needed
    }
    if (filters.difficulty && type === 'question') {
      query.difficulty = filters.difficulty;
    }
    if (filters.search) {
      if (type === 'question') {
        query.question = { $regex: filters.search, $options: 'i' };
      } else if (type === 'summary') {
        andConditions.push({
          $or: [
            { generalSummary: { $regex: filters.search, $options: 'i' } },
            { detailedSummary: { $regex: filters.search, $options: 'i' } },
          ]
        });
      } else if (type === 'presentation') {
        query['slides.title'] = { $regex: filters.search, $options: 'i' };
      } else if (type === 'quiz') {
        query['questions.question'] = { $regex: filters.search, $options: 'i' };
      }
    }

    // Combine all conditions
    let finalQuery = query;
    if (andConditions.length > 0) {
      if (Object.keys(query).length > 0) {
        andConditions.push(query);
      }
      finalQuery = { $and: andConditions };
    }

    const [items, total] = await Promise.all([
      model.find(finalQuery).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      model.countDocuments(finalQuery),
    ]);

    // Transform items to unified format
    const transformedItems = items.map(item => this.transformToResponse(item, type));

    return {
      items: transformedItems,
      total,
    };
  }

  private transformToResponse(item: any, type: ContentType) {
    let title = '';
    let subject = '';
    let unit = '';
    let difficulty = undefined;

    switch (type) {
      case 'question':
        title = item.question?.substring(0, 100) || 'Question';
        subject = item.subjectTitle || '';
        
        if (item.subunitTitle) {
          unit = item.subunitNumber ? `${item.subunitNumber} ${item.subunitTitle}` : item.subunitTitle;
        } else {
          unit = item.unitTitle || '';
        }
        
        difficulty = item.difficulty;
        break;
      case 'summary':
        title = item.subunit ? `Summary: ${item.subunit}` : `Summary: ${item.unit}`;
        subject = item.subject || '';
        unit = item.unit || '';
        break;
      case 'presentation':
        title = `Presentation: ${item.unit}`;
        subject = item.subject || '';
        unit = item.unit || '';
        break;
      case 'quiz':
        title = `Quiz: ${item.unit}`;
        subject = item.subject || '';
        unit = item.unit || '';
        break;
      case 'model_exam':
        title = item.title || `Model Exam: ${item.gradeTitle || ''} ${item.subjectTitle || ''}`;
        subject = item.subjectTitle || '';
        unit = item.gradeTitle || '';
        break;
    }

    return {
      _id: item._id.toString(),
      type,
      title,
      subject,
      unit,
      difficulty,
      status: item.status || 'pending',
      source: item.source || 'llm-generated',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async findOne(type: ContentType, id: string) {
    const model = this.getModel(type);
    const item = await model.findById(id).lean();

    if (!item) {
      throw new NotFoundException(`${type} with id ${id} not found`);
    }

    return { ...item, type };
  }

  async update(type: ContentType, id: string, updateDto: any) {
    const model = this.getModel(type);
    const item = await model.findByIdAndUpdate(id, updateDto, { new: true }).lean();

    if (!item) {
      throw new NotFoundException(`${type} with id ${id} not found`);
    }

    return { ...item, type };
  }

  async approve(type: ContentType, id: string, reviewerComment?: string, reviewedBy?: string) {
    const model = this.getModel(type);
    const updateData: any = {
      status: 'approved',
      reviewedAt: new Date(),
    };

    // For questions, also update submissionStatus and isActive for teacher workflow
    if (type === 'question') {
      updateData.submissionStatus = 'approved';
      updateData.isActive = true;
    }

    if (reviewerComment) updateData.reviewerComment = reviewerComment;
    if (reviewedBy) updateData.reviewedBy = reviewedBy;

    const item = await model.findByIdAndUpdate(id, updateData, { new: true }).lean();

    if (!item) {
      throw new NotFoundException(`${type} with id ${id} not found`);
    }

    return { ...item, type, message: 'Content approved successfully' };
  }

  async suspend(type: ContentType, id: string, reviewerComment?: string, reviewedBy?: string) {
    const model = this.getModel(type);
    const updateData: any = {
      status: 'suspended',
      reviewedAt: new Date(),
    };

    if (reviewerComment) updateData.reviewerComment = reviewerComment;
    if (reviewedBy) updateData.reviewedBy = reviewedBy;

    // POLICY UPDATE: Rejecting content now DELETES it permanently
    const item = await model.findByIdAndDelete(id).lean();

    if (!item) {
      throw new NotFoundException(`${type} with id ${id} not found`);
    }

    return { ...item, type, message: 'Content rejected and deleted successfully' };
  }

  async getStats(): Promise<ContentStatsDto> {
    const [questionStats, summaryStats, presentationStats, quizStats] = await Promise.all([
      this.getModelStats(this.questionModel),
      this.getModelStats(this.summaryModel),
      this.getModelStats(this.presentationModel),
      this.getModelStats(this.quizModel),
    ]);

    return {
      totalPending:
        questionStats.pending + summaryStats.pending + presentationStats.pending + quizStats.pending,
      totalApproved:
        questionStats.approved + summaryStats.approved + presentationStats.approved + quizStats.approved,
      totalSuspended:
        questionStats.suspended +
        summaryStats.suspended +
        presentationStats.suspended +
        quizStats.suspended,
      byType: {
        question: questionStats,
        summary: summaryStats,
        presentation: presentationStats,
        quiz: quizStats,
      },
    };
  }

  private async getModelStats(model: Model<any>) {
    const [pending, approved, suspended, noStatus] = await Promise.all([
      model.countDocuments({ status: 'pending' }),
      model.countDocuments({ status: 'approved' }),
      model.countDocuments({ status: 'suspended' }),
      model.countDocuments({ status: { $exists: false } }), // Count documents without status field
    ]);

    return { 
      pending: pending + noStatus, // Treat documents without status as pending
      approved, 
      suspended 
    };
  }

  async bulkApprove(type: ContentType, ids: string[], reviewedBy?: string) {
    const model = this.getModel(type);
    
    const updateData: any = {
      status: 'approved',
      reviewedAt: new Date(),
      ...(reviewedBy && { reviewedBy }),
    };

    // For questions, also update submissionStatus and isActive for teacher workflow
    if (type === 'question') {
      updateData.submissionStatus = 'approved';
      updateData.isActive = true;
    }

    const result = await model.updateMany(
      { _id: { $in: ids } },
      updateData,
    );

    return { modifiedCount: result.modifiedCount, message: 'Content approved successfully' };
  }

  async bulkSuspend(type: ContentType, ids: string[], reviewedBy?: string) {
    const model = this.getModel(type);
    const result = await model.updateMany(
      { _id: { $in: ids } },
      {
        status: 'suspended',
        reviewedAt: new Date(),
        ...(reviewedBy && { reviewedBy }),
      },
    );

    return { modifiedCount: result.modifiedCount, message: 'Content suspended successfully' };
  }

  /**
   * Find content pending teacher approval, filtered by teacher's assigned grades/subjects
   */
  async findAllForTeacher(query: {
    teacherId: string;
    contentType?: ContentType;
    page?: number;
    limit?: number;
  }) {
    const { teacherId, contentType, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Look up teacher's grade/subject from DB
    const ctx = await this.resolveTeacherContext(teacherId);
    if (!ctx) {
      return { items: [], counts: { questions: 0, summaries: 0, model_exams: 0 }, total: 0, page, limit, totalPages: 0 };
    }

    const { gradeTitle, subjectTitle, gradeId, subjectId } = ctx;

    // Content types that support teacher approval
    const teacherContentTypes: ContentType[] = ['question', 'summary', 'model_exam'];
    const typesToQuery = contentType ? [contentType] : teacherContentTypes;

    const allItems: any[] = [];
    const counts: Record<string, number> = { questions: 0, summaries: 0, model_exams: 0 };

    for (const type of typesToQuery) {
      let filter: any;
      
      if (type === 'question') {
        // Questions use submissionStatus + creatorType, NOT teacherApprovalStatus
        filter = {
          submissionStatus: 'pending',
          creatorType: 'admin',
          gradeId: gradeId,
          subjectId: subjectId,
        };
      } else if (type === 'summary') {
        filter = {
          teacherApprovalStatus: 'pending_teacher',
          ...(gradeTitle && { grade: { $regex: gradeTitle, $options: 'i' } }),
          ...(subjectTitle && { subject: { $regex: subjectTitle, $options: 'i' } }),
        };
      } else if (type === 'model_exam') {
        filter = {
          teacherApprovalStatus: 'pending_teacher',
          subjectId: subjectId,
        };
      } else {
        continue;
      }

      const model = this.getModel(type);
      const [items, count] = await Promise.all([
        model.find(filter).sort({ createdAt: -1 }).lean(),
        model.countDocuments(filter),
      ]);

      // Update counts
      if (type === 'question') counts.questions = count;
      else if (type === 'summary') counts.summaries = count;
      else if (type === 'model_exam') counts.model_exams = count;

      // Transform and add to all items
      items.forEach((item: any) => {
        allItems.push({
          ...this.transformToResponse(item, type),
          contentType: type,
          // Include full question data for display
          ...(type === 'question' && {
            question: item.question,
            options: item.options,
            answer: item.answer,
            hint: item.hint,
            explanation: item.explanation,
            type: item.type,
            difficulty: item.difficulty,
            unitNumber: item.unitNumber,
            unitTitle: item.unitTitle,
            subunitNumber: item.subunitNumber,
            subunitTitle: item.subunitTitle,
            questionId: item.questionId,
          }),
          teacherApprovalStatus: item.teacherApprovalStatus || item.submissionStatus,
        });
      });
    }

    // Sort by createdAt and paginate
    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const paginatedItems = allItems.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      counts,
      total: allItems.length,
      page,
      limit,
      totalPages: Math.ceil(allItems.length / limit),
      teacherInfo: { gradeTitle: gradeTitle || 'Unknown', subjectTitle: subjectTitle || 'Unknown' },
    };
  }

  /**
   * Teacher approves content - updates teacherApprovalStatus
   */
  async teacherApprove(type: ContentType, id: string, teacherId: string) {
    const model = this.getModel(type);
    const updateData: any = {
      teacherApprovalStatus: 'approved',
      approvedByTeacherId: teacherId,
      teacherApprovalDate: new Date(),
    };

    // For questions, also update submission status
    if (type === 'question') {
      updateData.submissionStatus = 'approved';
      updateData.status = 'approved';
      updateData.isActive = true;
    }

    const item = await model.findByIdAndUpdate(id, updateData, { new: true }).lean();

    if (!item) {
      throw new NotFoundException(`${type} with id ${id} not found`);
    }

    return { ...item, type, message: 'Content approved by teacher successfully' };
  }

  /**
   * Teacher rejects content with reason - updates teacherApprovalStatus
   */
  async teacherReject(type: ContentType, id: string, teacherId: string, reason: string) {
    const model = this.getModel(type);
    const updateData: any = {
      teacherApprovalStatus: 'rejected',
      approvedByTeacherId: teacherId,
      teacherApprovalDate: new Date(),
      teacherRejectionReason: reason,
    };

    const item = await model.findByIdAndUpdate(id, updateData, { new: true }).lean();

    if (!item) {
      throw new NotFoundException(`${type} with id ${id} not found`);
    }

    return { ...item, type, message: 'Content rejected by teacher' };
  }

  /**
   * Get teacher-specific stats (content pending their approval)
   */
  async getTeacherStats(teacherId: string) {
    const ctx = await this.resolveTeacherContext(teacherId);
    if (!ctx) {
      return { questions: 0, summaries: 0, model_exams: 0, total: 0 };
    }

    const { gradeTitle, subjectTitle, gradeId, subjectId } = ctx;
    const counts: Record<string, number> = { questions: 0, summaries: 0, model_exams: 0, total: 0 };

    // Questions use submissionStatus + creatorType
    counts.questions = await this.questionModel.countDocuments({
      submissionStatus: 'pending',
      creatorType: 'admin',
      gradeId,
      subjectId,
    });

    // Summaries use teacherApprovalStatus + grade/subject titles  
    const summaryFilter: any = { teacherApprovalStatus: 'pending_teacher' };
    if (gradeTitle) summaryFilter.grade = { $regex: gradeTitle, $options: 'i' };
    if (subjectTitle) summaryFilter.subject = { $regex: subjectTitle, $options: 'i' };
    counts.summaries = await this.summaryModel.countDocuments(summaryFilter);

    // Model exams use teacherApprovalStatus + subjectId
    counts.model_exams = await this.modelExamModel.countDocuments({
      teacherApprovalStatus: 'pending_teacher',
      subjectId,
    });

    counts.total = counts.questions + counts.summaries + counts.model_exams;
    return counts;
  }
}
