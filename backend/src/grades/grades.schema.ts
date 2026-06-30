import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Grade {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  gradeNumber: number;
}

export const GradeSchema = SchemaFactory.createForClass(Grade);

// ✅ Export the document type
export type GradeDocument = Grade & Document;
