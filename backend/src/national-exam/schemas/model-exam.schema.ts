import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ModelExamStatus = 'draft' | 'published' | 'archived';
export type ModelExamType = 'real' | 'practice';

/**
 * Blueprint item specifying question allocation per unit
 */
export interface BlueprintItem {
  grade: number;
  unitNumber: number;
  unitTitle: string;
  subunitNumber?: string;
  subunitTitle?: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cognitiveLevel?: 'recall' | 'understanding' | 'application' | 'analysis';
  confidence: number; // 0-1, how confident we are in this allocation based on patterns
}

/**
 * Model Exam - A generated entrance exam based on pattern analysis
 */
@Schema({ timestamps: true })
export class ModelExam extends Document {
  @Prop({ required: true })
  title: string; // e.g., "Model Entrance Exam – Chemistry 2024"

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ required: true })
  subjectTitle: string;

  @Prop({ type: Types.ObjectId, ref: 'NationalExamPattern' })
  patternId?: Types.ObjectId; // Reference to the pattern used

  @Prop({ type: Types.ObjectId, ref: 'Grade' })
  gradeId?: Types.ObjectId;

  @Prop({ default: 'Grade 12' })
  gradeTitle: string; // Default to Grade 12 for entrance exams

  @Prop({ type: [Number], required: true })
  basedOnYears: number[]; // Source exam years used

  @Prop({ required: true })
  duration: number; // Duration in minutes (e.g., 180 for 3 hours)

  @Prop({ required: true })
  totalQuestions: number;

  @Prop({ type: [Object] })
  blueprint?: BlueprintItem[]; // Question allocation plan

  @Prop({
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: ModelExamStatus;

  @Prop({
    required: true,
    enum: ['real', 'practice'],
    default: 'practice',
  })
  examType: ModelExamType; // 'real' = timed exam, results at end; 'practice' = with hints

  @Prop({ default: 0 })
  generatedQuestionsCount: number;

  @Prop()
  publishedAt?: Date;

  @Prop({ required: true })
  createdBy: string; // Admin ID

  @Prop()
  publishedBy?: string;

  @Prop()
  description?: string;

  // Teacher approval workflow (for admin-created content)
  @Prop({ 
    enum: ['pending_teacher', 'approved', 'rejected', 'not_required'],
    default: 'not_required',
    index: true 
  })
  teacherApprovalStatus: string;

  @Prop()
  approvedByTeacherId?: string;

  @Prop()
  teacherApprovalDate?: Date;

  @Prop()
  teacherRejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ModelExamSchema = SchemaFactory.createForClass(ModelExam);

// Indexes
ModelExamSchema.index({ subjectId: 1, status: 1 });
ModelExamSchema.index({ status: 1, createdAt: -1 });
// Index for teacher approval queries
ModelExamSchema.index({ subjectId: 1, teacherApprovalStatus: 1 });

export type ModelExamDocument = ModelExam & Document;
