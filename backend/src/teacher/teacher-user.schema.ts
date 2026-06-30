import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeacherUserDocument = TeacherUser & Document;

@Schema({ timestamps: true })
export class TeacherUser {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'teacher' })
  role: string;

  @Prop({ default: () => `TCH-${Date.now()}` })
  teacherId: string;

  // Grade and Subject the teacher teaches
  @Prop({ type: Types.ObjectId, ref: 'Grade', index: true })
  gradeId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subject', index: true })
  subjectId?: Types.ObjectId;

  // School affiliation (one school per teacher)
  @Prop({ type: Types.ObjectId, ref: 'School', index: true })
  schoolId?: Types.ObjectId;

  // BYOK: Teacher's personal Gemini API key (optional)
  @Prop()
  geminiApiKey?: string;
}

export const TeacherUserSchema = SchemaFactory.createForClass(TeacherUser);
