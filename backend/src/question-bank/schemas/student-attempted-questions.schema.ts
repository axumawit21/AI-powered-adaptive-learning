import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * StudentAttemptedQuestions Schema
 * Tracks all questions attempted by each student to ensure non-repetition
 * This is the critical component for the non-repeating question rule
 */

@Schema({ timestamps: true })
export class StudentAttemptedQuestions extends Document {
  // Reference to the student
  @Prop({ required: true, index: true })
  studentId: string;

  // Subject reference for faster queries
  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  // Grade reference
  @Prop({ type: Types.ObjectId, ref: 'Grade', index: true })
  gradeId: Types.ObjectId;

  // Unit number for filtering
  @Prop({ type: Number, index: true })
  unitNumber: number;

  // Array of attempted question IDs
  @Prop({ type: [String], default: [], index: true })
  attemptedQuestionIds: string[];

  // Detailed attempt records
  @Prop({
    type: [{
      questionId: { type: String, required: true },
      attemptedAt: { type: Date, default: Date.now },
      context: { type: String, enum: ['quiz', 'exam', 'practice'], default: 'quiz' },
      wasCorrect: { type: Boolean },
      attemptNumber: { type: Number, default: 1 },
      sessionId: { type: String }
    }],
    default: []
  })
  attemptDetails: {
    questionId: string;
    attemptedAt: Date;
    context: 'quiz' | 'exam' | 'practice';
    wasCorrect?: boolean;
    attemptNumber: number;
    sessionId?: string;
  }[];
}

export const StudentAttemptedQuestionsSchema = SchemaFactory.createForClass(StudentAttemptedQuestions);

// Compound index for efficient lookups
StudentAttemptedQuestionsSchema.index({ studentId: 1, subjectId: 1 });
StudentAttemptedQuestionsSchema.index({ studentId: 1, subjectId: 1, unitNumber: 1 });
StudentAttemptedQuestionsSchema.index({ studentId: 1, attemptedQuestionIds: 1 });

export type StudentAttemptedQuestionsDocument = StudentAttemptedQuestions & Document;
