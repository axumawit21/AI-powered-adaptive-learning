import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

@Schema({ timestamps: true })
export class ExamPaperQuestion extends Document {
  @Prop({ type: Types.ObjectId, ref: 'ExamPaper', required: true, index: true })
  examPaperId: Types.ObjectId;

  @Prop({ required: true })
  questionNumber: number;

  @Prop({ required: true })
  question: string;

  @Prop({ type: [String], required: true })
  options: string[]; // ["A. option text", "B. option text", "C. option text", "D. option text"]

  @Prop({ required: false })
  answer: string; // The correct option letter: "A", "B", "C", or "D"

  @Prop({ required: false })
  hint: string; // AI-generated hint for first wrong attempt

  @Prop({ required: false })
  explanation: string; // AI-generated explanation for second wrong attempt

  @Prop({ 
    required: true, 
    enum: ['pending', 'approved', 'rejected', 'needs_review'],
    default: 'pending',
    index: true 
  })
  approvalStatus: QuestionApprovalStatus;

  @Prop()
  reviewerComment?: string;

  @Prop()
  editedBy?: string;

  @Prop()
  editedAt?: Date;

  // Original extracted text (before any edits)
  @Prop()
  originalQuestion?: string;

  @Prop({ type: [String] })
  originalOptions?: string[];

  // Image support for questions with diagrams/figures
  @Prop()
  imageUrl?: string; // URL/path to the question image (if any)

  @Prop({ default: false })
  hasImage: boolean; // Flag to indicate if question has image

  @Prop()
  imageDescription?: string; // Textual description of the image for LLM context (required if hasImage is true)

  // Option image support (for options with diagrams/structures)
  @Prop({ type: [String], default: [null, null, null, null] })
  optionImageUrls: (string | null)[]; // URLs for options A, B, C, D

  @Prop({ type: [String], default: [null, null, null, null] })
  optionImageDescriptions: (string | null)[]; // Descriptions for options A, B, C, D

  // Classification fields (populated by AI analysis)

  @Prop()
  grade?: number; // Grade level (9, 10, 11, 12)

  @Prop()
  unitNumber?: number; // Unit number within the grade

  @Prop()
  unitTitle?: string; // Title of the unit

  createdAt: Date;
  updatedAt: Date;
}

export const ExamPaperQuestionSchema = SchemaFactory.createForClass(ExamPaperQuestion);

// Compound indexes
ExamPaperQuestionSchema.index({ examPaperId: 1, approvalStatus: 1 });
ExamPaperQuestionSchema.index({ examPaperId: 1, questionNumber: 1 });

export type ExamPaperQuestionDocument = ExamPaperQuestion & Document;
