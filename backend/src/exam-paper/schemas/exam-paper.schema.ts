import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamPaperStatus = 'processing' | 'pending_review' | 'approved' | 'rejected';

@Schema({ timestamps: true })
export class ExamPaper extends Document {
  @Prop({ required: true })
  uploadedBy: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ type: Types.ObjectId, ref: 'Grade', required: true, index: true })
  gradeId: Types.ObjectId;

  @Prop({ required: true })
  gradeTitle: string;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ required: true })
  subjectTitle: string;

  @Prop({ required: true, index: true })
  examYear: number;

  @Prop({ 
    required: true, 
    enum: ['processing', 'pending_review', 'approved', 'rejected'],
    default: 'processing',
    index: true 
  })
  status: ExamPaperStatus;

  @Prop()
  processingError?: string;

  @Prop({ default: 0 })
  questionsCount: number;

  @Prop({ default: 0 })
  approvedQuestionsCount: number;

  @Prop()
  processedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ExamPaperSchema = SchemaFactory.createForClass(ExamPaper);

// Compound indexes for efficient querying
ExamPaperSchema.index({ gradeId: 1, subjectId: 1, examYear: 1 });
ExamPaperSchema.index({ status: 1, gradeId: 1 });

export type ExamPaperDocument = ExamPaper & Document;
