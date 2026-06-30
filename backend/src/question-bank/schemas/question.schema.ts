import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Question Schema - Pre-generated questions stored in the database
 * Each question is generated once by LLM and stored permanently
 * Organized by: Subject → Unit → Subunit → Difficulty
 */

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'true-false' | 'fill-blank' | 'short-answer' | 'matching';
export type ContentStatus = 'pending' | 'approved' | 'suspended';

@Schema({ timestamps: true })
export class Question extends Document {
  // Unique identifier for the question (auto-generated if not provided)
  @Prop({ required: true, unique: true, index: true })
  questionId: string;

  // Subject reference
  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ required: true })
  subjectTitle: string;

  // Grade reference
  @Prop({ type: Types.ObjectId, ref: 'Grade', required: true, index: true })
  gradeId: Types.ObjectId;

  @Prop({ required: true })
  gradeTitle: string;

  // Unit information
  @Prop({ required: true, index: true })
  unitNumber: number;

  @Prop({ required: true })
  unitTitle: string;

  // Subunit information (optional)
  @Prop()
  subunitNumber: string; // e.g., "1.1", "1.2"

  @Prop()
  subunitTitle: string;

  // Question type
  @Prop({ 
    required: true, 
    enum: ['mcq', 'true-false', 'fill-blank', 'short-answer', 'matching'],
    index: true 
  })
  type: QuestionType;

  // Difficulty level
  @Prop({ 
    required: true, 
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    index: true 
  })
  difficulty: DifficultyLevel;

  // Question content
  @Prop({ required: true })
  question: string;

  // Options for MCQ questions
  @Prop({ type: [String], default: [] })
  options: string[];

  // Pairs for matching questions
  @Prop({ type: [{ left: String, right: String }], default: [] })
  pairs: { left: string; right: string }[];

  // Correct answer
  @Prop({ required: true })
  answer: string;

  // Hint for first wrong attempt
  @Prop({ required: true })
  hint: string;

  // Explanation for second wrong attempt
  @Prop({ required: true })
  explanation: string;

  // Tags for categorization
  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  // Source of the question
  @Prop({ default: 'llm-generated' })
  source: string;

  // Book reference (optional)
  @Prop({ type: Types.ObjectId, ref: 'Book' })
  bookId: Types.ObjectId;

  // Active status
  @Prop({ default: true })
  isActive: boolean;

  // Usage statistics
  @Prop({ default: 0 })
  timesUsed: number;

  @Prop({ default: 0 })
  correctAttempts: number;

  @Prop({ default: 0 })
  incorrectAttempts: number;

  // Content moderation status
  @Prop({ 
    required: true, 
    enum: ['pending', 'approved', 'suspended'],
    default: 'pending',
    index: true 
  })
  status: ContentStatus;

  // Review metadata
  @Prop()
  reviewerComment?: string;

  @Prop()
  reviewedBy?: string;

  @Prop()
  reviewedAt?: Date;

  // Teacher/Creator metadata
  @Prop({ type: Types.ObjectId, ref: 'Student' })
  createdBy?: Types.ObjectId;

  @Prop({ enum: ['teacher', 'ai', 'admin'], default: 'ai' })
  creatorType: string;

  @Prop({ 
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'approved' 
  })
  submissionStatus: string;

  @Prop()
  adminComments?: string;

  @Prop({ type: [{ date: Date, changes: String, changedBy: String }], default: [] })
  revisionHistory: { date: Date; changes: string; changedBy: string }[];
}
export const QuestionSchema = SchemaFactory.createForClass(Question);

// Compound indexes for efficient querying
QuestionSchema.index({ subjectId: 1, unitNumber: 1, difficulty: 1 });
QuestionSchema.index({ gradeId: 1, subjectId: 1, unitNumber: 1 });
QuestionSchema.index({ subjectId: 1, unitNumber: 1, subunitNumber: 1, difficulty: 1 });
// Index for teacher approval queries (listPendingApprovals, getPendingApprovalCount)
QuestionSchema.index({ creatorType: 1, submissionStatus: 1, gradeId: 1, subjectId: 1 });
// Index for teacher's own questions (getDashboardStats, listQuestions)
QuestionSchema.index({ createdBy: 1, creatorType: 1, submissionStatus: 1 });

export type QuestionDocument = Question & Document;
