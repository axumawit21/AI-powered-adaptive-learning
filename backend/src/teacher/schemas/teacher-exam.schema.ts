import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Exam Types supported
 */
export type ExamType = 'quiz' | 'midterm' | 'final' | 'assignment';

/**
 * Exam Status
 */
export type TeacherExamStatus = 'draft' | 'finalized' | 'archived';

/**
 * Question in an exam with marks and order
 */
export class ExamQuestion {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ required: true })
  answer: string;

  @Prop({ 
    required: true, 
    enum: ['mcq', 'true-false', 'fill-blank', 'short-answer', 'matching']
  })
  type: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: string;

  @Prop({ required: true, default: 1 })
  marks: number;

  @Prop({ required: true })
  order: number;

  @Prop()
  hint?: string;

  @Prop()
  explanation?: string;
}

/**
 * School Info for exam header
 */
export class SchoolInfo {
  @Prop()
  name?: string;

  @Prop()
  address?: string;

  @Prop()
  logo?: string;

  @Prop()
  phone?: string;
}

/**
 * Teacher Exam - Exam created by teacher for classroom use
 * Can be printed for mid-term, final, quiz assessments
 */
@Schema({ timestamps: true })
export class TeacherExam extends Document {
  // Unique exam identifier
  @Prop({ required: true, unique: true, index: true })
  examId: string;

  // Owner teacher
  @Prop({ type: Types.ObjectId, ref: 'TeacherUser', required: true, index: true })
  teacherId: Types.ObjectId;

  // Exam metadata
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: ['quiz', 'midterm', 'final', 'assignment'], index: true })
  examType: ExamType;

  @Prop({ type: Types.ObjectId, ref: 'Grade', required: true, index: true })
  gradeId: Types.ObjectId;

  @Prop({ required: true })
  gradeTitle: string;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ required: true })
  subjectTitle: string;

  // Academic context
  @Prop()
  academicYear?: string;

  @Prop()
  semester?: string;

  @Prop()
  section?: string;

  // Questions in this exam
  @Prop({ type: [ExamQuestion], default: [] })
  questions: ExamQuestion[];

  // Exam settings
  @Prop({ default: 0 })
  totalMarks: number;

  @Prop()
  duration?: number; // in minutes

  @Prop()
  passingMarks?: number;

  @Prop({ default: '' })
  instructions: string;

  // School info for print header
  @Prop({ type: SchoolInfo })
  schoolInfo?: SchoolInfo;

  // Status
  @Prop({ 
    required: true, 
    enum: ['draft', 'finalized', 'archived'],
    default: 'draft',
    index: true 
  })
  status: TeacherExamStatus;

  // Print/version info
  @Prop({ default: 0 })
  printCount: number;

  @Prop()
  lastPrintedAt?: Date;

  @Prop({ default: 1 })
  versions: number; // Number of randomized versions generated

  // Units covered (for reference)
  @Prop({ type: [Number], default: [] })
  unitsCovered: number[];

  // Difficulty distribution (for reference)
  @Prop({ type: Object })
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const TeacherExamSchema = SchemaFactory.createForClass(TeacherExam);

// Compound indexes for efficient querying
TeacherExamSchema.index({ teacherId: 1, examType: 1, status: 1 });
TeacherExamSchema.index({ teacherId: 1, gradeId: 1, subjectId: 1 });
TeacherExamSchema.index({ teacherId: 1, createdAt: -1 });

export type TeacherExamDocument = TeacherExam & Document;
