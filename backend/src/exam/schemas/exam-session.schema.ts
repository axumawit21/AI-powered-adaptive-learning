import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ExamSession extends Document {
  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true })
  subjectId: string;

  @Prop()
  subjectTitle?: string;

  @Prop()
  gradeId?: string; // Added for progress tracking

  @Prop()
  unitId?: string; // Optional if subject-wide exam

  @Prop({ required: true, enum: ['unit', 'subject'] })
  type: 'unit' | 'subject';

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ type: [{ 
    questionText: String, 
    type: { type: String, enum: ['multiple_choice', 'true_false', 'fill_blank'] },
    options: [String],
    correctAnswer: String,
    studentAnswer: String,
    isCorrect: Boolean
  }], default: [] })
  questions: {
    questionText: string;
    type: 'multiple_choice' | 'true_false' | 'fill_blank';
    options?: string[];
    correctAnswer: string;
    studentAnswer?: string;
    isCorrect?: boolean;
  }[];

  @Prop({ default: false })
  completed: boolean;

  @Prop()
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ExamSessionSchema = SchemaFactory.createForClass(ExamSession);
