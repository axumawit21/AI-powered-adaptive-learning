
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SummaryDocument = Summary & Document;
export type ContentStatus = 'pending' | 'approved' | 'suspended';

// Teacher audio script structure
export class TeacherAudioScript {
  @Prop()
  introduction?: string;

  @Prop()
  explanation?: string;

  @Prop()
  examples?: string;

  @Prop()
  recap?: string;
}

// Dialogue script entry
export class DialogueEntry {
  @Prop({ enum: ['male', 'female'] })
  speaker: string;

  @Prop()
  text: string;
}

@Schema({ timestamps: true })
export class Summary {
  @Prop({ required: true })
  grade: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  unit: string;

  @Prop()
  subunit: string;

  @Prop({ required: true })
  generalSummary: string;

  @Prop({ required: true })
  detailedSummary: string;

  @Prop({ type: [String], default: [] })
  keyConcepts: string[];

  // Teacher audio script for text-to-speech
  @Prop({ type: Object })
  teacherAudioScript?: TeacherAudioScript;

  // Dialogue script for male/female voice alternation
  @Prop({ type: [Object], default: [] })
  dialogueScript?: DialogueEntry[];

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

  // Audio generation
  @Prop()
  audioFilePath?: string;

  @Prop()
  audioGeneratedAt?: Date;

  // Manual audio upload (e.g. NotebookLM)
  @Prop()
  customAudioUrl?: string;

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
}

export const SummarySchema = SchemaFactory.createForClass(Summary);

// Add compound index for unique lookups (including subunit for subunit-level summaries)
// Using sparse: false since subunit can be empty string for unit-level summaries
SummarySchema.index({ grade: 1, subject: 1, unit: 1, subunit: 1 }, { unique: true });
// Index for teacher approval queries
SummarySchema.index({ grade: 1, subject: 1, teacherApprovalStatus: 1 });

