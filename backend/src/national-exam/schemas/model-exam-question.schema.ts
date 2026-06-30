import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type CognitiveLevel = 'recall' | 'understanding' | 'application' | 'analysis';

/**
 * Generated Model Exam Question
 * Each question is original, generated using RAG from textbooks
 */
@Schema({ timestamps: true })
export class ModelExamQuestion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ModelExam', required: true, index: true })
  modelExamId: Types.ObjectId;

  @Prop({ required: true })
  questionNumber: number;

  @Prop({ required: true })
  question: string;

  @Prop({ type: Object, required: true })
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };

  @Prop({ required: true, enum: ['A', 'B', 'C', 'D'] })
  correctAnswer: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: QuestionDifficulty;

  @Prop({ required: true })
  grade: number; // Grade level (9, 10, 11, 12)

  @Prop({ required: true })
  unitNumber: number;

  @Prop({ required: true })
  unitTitle: string;

  @Prop()
  subunitNumber?: string;

  @Prop()
  subunitTitle?: string;

  @Prop({ required: true })
  shortExplanation: string; // Brief explanation for the correct answer

  @Prop({ enum: ['recall', 'understanding', 'application', 'analysis'] })
  cognitiveLevel?: CognitiveLevel;

  @Prop()
  hint?: string; // Optional hint for students

  // Source tracking for audit purposes
  @Prop()
  sourceChunkId?: string; // Reference to Qdrant chunk used

  @Prop()
  generatedAt?: Date;

  // For admin review
  @Prop({ default: false })
  isReviewed: boolean;

  @Prop()
  reviewedBy?: string;

  @Prop()
  reviewNotes?: string;

  // AI-generated diagram support for visual questions
  @Prop()
  imageUrl?: string; // URL/path to the generated diagram image

  @Prop({ default: false })
  hasImage: boolean; // Flag to indicate if question has a diagram

  @Prop()
  imageDescription?: string; // Description used to generate the diagram

  createdAt: Date;
  updatedAt: Date;
}

export const ModelExamQuestionSchema = SchemaFactory.createForClass(ModelExamQuestion);

// Indexes
ModelExamQuestionSchema.index({ modelExamId: 1, questionNumber: 1 });
ModelExamQuestionSchema.index({ modelExamId: 1, grade: 1 });
ModelExamQuestionSchema.index({ modelExamId: 1, difficulty: 1 });

export type ModelExamQuestionDocument = ModelExamQuestion & Document;
