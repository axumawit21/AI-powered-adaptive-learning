import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Progress extends Document {
  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true })
  bookId: string;

  @Prop()
  gradeId: string;

  @Prop()
  gradeTitle: string;

  @Prop()
  subjectId: string;

  @Prop()
  subjectTitle: string;

  @Prop({ type: [{ date: String, minutes: Number }], default: [] })
  dailyTime: { date: string; minutes: number }[];

  @Prop({
    type: [{
      quizId: String,
      unitNumber: Number,
      score: Number,
      totalQuestions: Number,
      attemptDate: { type: Date, default: Date.now },
      answers: [{ questionIndex: Number, correct: Boolean }]
    }],
    default: []
  })
  quizResults: {
    quizId: string;
    unitNumber: number;
    score: number;
    totalQuestions: number;
    attemptDate: Date;
    answers: { questionIndex: number; correct: boolean }[];
  }[];

  @Prop({
    type: [{
      unitNumber: Number,
      unitTitle: String,
      status: { type: String, enum: ['not_started', 'in_progress', 'completed'] },
      bestScore: Number
    }],
    default: []
  })
  unitsProgress: {
    unitNumber: number;
    unitTitle: string;
    status: 'not_started' | 'in_progress' | 'completed';
    bestScore: number;
  }[];

  @Prop({
    type: {
      content: String,
      generatedAt: { type: Date, default: Date.now },
      weakAreas: [String],
      strongAreas: [String],
      suggestedFocus: [String]
    },
    default: null
  })
  recommendations: {
    content: string;
    generatedAt: Date;
    weakAreas: string[];
    strongAreas: string[];
    suggestedFocus: string[];
  };

  @Prop({ default: Date.now })
  lastUpdated: Date;
}

export type ProgressDocument = Progress & Document;

export const ProgressSchema = SchemaFactory.createForClass(Progress);
ProgressSchema.index({ studentId: 1, subjectId: 1 });
