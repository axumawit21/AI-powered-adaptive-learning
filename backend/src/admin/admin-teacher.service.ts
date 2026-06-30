import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument } from '../question-bank/schemas/question.schema';

@Injectable()
export class AdminTeacherService {
  private readonly logger = new Logger(AdminTeacherService.name);

  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  /**
   * List all teacher-submitted questions pending review
   */
  async listPendingQuestions(dto: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    questions: QuestionDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { status = 'pending', page = 1, limit = 20 } = dto;

    const query: any = {
      creatorType: 'teacher',
    };

    if (status) {
      query.submissionStatus = status;
    }

    const [questions, total] = await Promise.all([
      this.questionModel
        .find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.questionModel.countDocuments(query),
    ]);

    return {
      questions: questions as unknown as QuestionDocument[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single teacher question for review
   */
  async getQuestionForReview(questionId: string): Promise<QuestionDocument> {
    const question = await this.questionModel
      .findOne({ questionId, creatorType: 'teacher' })
      .populate('createdBy', 'name email')
      .lean();

    if (!question) {
      throw new NotFoundException(`Teacher question not found: ${questionId}`);
    }

    return question as unknown as QuestionDocument;
  }

  /**
   * Approve a teacher-submitted question
   */
  async approveQuestion(questionId: string, adminId: string): Promise<QuestionDocument> {
    const question = await this.questionModel.findOne({ questionId, creatorType: 'teacher' });

    if (!question) {
      throw new NotFoundException(`Teacher question not found: ${questionId}`);
    }

    question.submissionStatus = 'approved';
    question.status = 'approved';
    question.isActive = true;
    question.reviewedBy = adminId;
    question.reviewedAt = new Date();
    question.revisionHistory.push({
      date: new Date(),
      changes: 'Approved by admin',
      changedBy: adminId,
    });

    const saved = await question.save();
    this.logger.log(`Admin ${adminId} approved question ${questionId}`);
    return saved;
  }

  /**
   * Reject a teacher-submitted question with comments
   */
  async rejectQuestion(
    questionId: string,
    adminId: string,
    comments: string,
  ): Promise<QuestionDocument> {
    const question = await this.questionModel.findOne({ questionId, creatorType: 'teacher' });

    if (!question) {
      throw new NotFoundException(`Teacher question not found: ${questionId}`);
    }

    question.submissionStatus = 'rejected';
    question.adminComments = comments;
    question.reviewedBy = adminId;
    question.reviewedAt = new Date();
    question.revisionHistory.push({
      date: new Date(),
      changes: `Rejected by admin: ${comments}`,
      changedBy: adminId,
    });

    const saved = await question.save();
    this.logger.log(`Admin ${adminId} rejected question ${questionId}`);
    return saved;
  }

  /**
   * Get review stats for admin dashboard
   */
  async getReviewStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    totalTeacherQuestions: number;
  }> {
    const query = { creatorType: 'teacher' };

    const [total, byStatus] = await Promise.all([
      this.questionModel.countDocuments(query),
      this.questionModel.aggregate([
        { $match: query },
        { $group: { _id: '$submissionStatus', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = byStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});

    return {
      totalTeacherQuestions: total,
      pending: statusMap['pending'] || 0,
      approved: statusMap['approved'] || 0,
      rejected: statusMap['rejected'] || 0,
    };
  }
}
