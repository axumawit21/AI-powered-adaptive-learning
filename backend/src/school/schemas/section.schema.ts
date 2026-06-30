import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SectionDocument = Section & Document;

@Schema({ timestamps: true })
export class Section {
  @Prop({ required: true })
  name: string; // e.g., "10-A", "11-B"

  @Prop({ type: Types.ObjectId, ref: 'School', required: true, index: true })
  schoolId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Grade', required: true })
  gradeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TeacherUser' })
  homeroomTeacherId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: () => `SEC-${Date.now()}` })
  sectionId: string;
}

export const SectionSchema = SchemaFactory.createForClass(Section);

// Compound index for unique section names within a school
SectionSchema.index({ schoolId: 1, name: 1 }, { unique: true });
