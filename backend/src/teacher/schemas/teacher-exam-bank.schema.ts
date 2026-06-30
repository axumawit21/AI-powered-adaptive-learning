import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Teacher Exam Bank - Private question storage for teachers
 * When a teacher approves content, they can store it here for exam creation
 * instead of making it available to students
 */

@Schema({ timestamps: true })
export class TeacherExamBank extends Document {
  // Owner teacher
  @Prop({ type: Types.ObjectId, ref: 'TeacherUser', required: true, index: true })
  teacherId: Types.ObjectId;

  // Reference to the original question
  @Prop({ required: true, index: true })
  questionId: string;

  // Denormalized question data for quick access
  @Prop({ type: Types.ObjectId, ref: 'Grade', required: true, index: true })
  gradeId: Types.ObjectId;

  @Prop({ required: true })
  gradeTitle: string;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ required: true })
  subjectTitle: string;

  @Prop({ required: true })
  unitNumber: number;

  @Prop({ required: true })
  unitTitle: string;

  @Prop()
  subunitNumber?: string;

  @Prop()
  subunitTitle?: string;

  @Prop({ 
    required: true, 
    enum: ['mcq', 'true-false', 'fill-blank', 'short-answer', 'matching'],
    index: true 
  })
  type: string;

  @Prop({ 
    required: true, 
    enum: ['easy', 'medium', 'hard'],
    index: true 
  })
  difficulty: string;

  // Question content (denormalized for quick preview)
  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ required: true })
  answer: string;

  @Prop()
  hint?: string;

  @Prop()
  explanation?: string;

  // Usage tracking
  @Prop({ default: 0 })
  usageCount: number;

  @Prop()
  lastUsedAt?: Date;

  // Custom tags by teacher
  @Prop({ type: [String], default: [] })
  tags: string[];

  // Teacher's personal notes about this question
  @Prop()
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const TeacherExamBankSchema = SchemaFactory.createForClass(TeacherExamBank);

// Compound indexes for efficient querying
TeacherExamBankSchema.index({ teacherId: 1, gradeId: 1, subjectId: 1 });
TeacherExamBankSchema.index({ teacherId: 1, unitNumber: 1, difficulty: 1 });
TeacherExamBankSchema.index({ teacherId: 1, type: 1, difficulty: 1 });
TeacherExamBankSchema.index({ teacherId: 1, questionId: 1 }, { unique: true });

export type TeacherExamBankDocument = TeacherExamBank & Document;
