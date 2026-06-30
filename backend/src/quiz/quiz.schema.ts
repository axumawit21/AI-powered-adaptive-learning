import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Question type interfaces
export interface BaseQuestion {
  type: 'mcq' | 'true-false' | 'fill-blank' | 'short-answer' | 'matching';
  question: string;
  answer: string;
  hint: string;
  explanation: string;
}

export interface MCQQuestion extends BaseQuestion {
  type: 'mcq';
  options: string[]; // ["A) option1", "B) option2", ...]
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true-false';
  // answer will be "true" or "false"
}

export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill-blank';
  // question contains "___" for the blank
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  // answer is a model answer (2-3 sentences)
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  pairs: Array<{ left: string; right: string }>;
  // answer will be "match-all"
}

export type QuizQuestion = MCQQuestion | TrueFalseQuestion | FillBlankQuestion | ShortAnswerQuestion | MatchingQuestion;
export type ContentStatus = 'pending' | 'approved' | 'suspended';

@Schema({ timestamps: true })
export class Quiz extends Document {
  @Prop({ required: true })
  grade: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  unit: string;

  @Prop()
  subunit?: string; // e.g., "1.1" or "Cell Structure"

  @Prop({ type: Array, default: [] })
  questions: QuizQuestion[];

  @Prop({ default: 'ai-generated' })
  source: string;

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
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

