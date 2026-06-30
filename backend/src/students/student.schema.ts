import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Student extends Document {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string; // hashed later

  @Prop({ enum: ['student'], default: 'student' })
  role: string;

  @Prop({ default: () => `STU-${Date.now()}` })
  studentId: string;

  // Grade level (1-12) for routing to appropriate content
  @Prop({ type: Number, min: 1, max: 12, index: true })
  gradeNumber?: number;

  // School multi-tenancy fields
  @Prop({ type: Types.ObjectId, ref: 'School', index: true })
  schoolId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Section' })
  sectionId?: Types.ObjectId;

  // BYOK: Student's personal Gemini API key (optional)
  @Prop()
  geminiApiKey?: string;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

