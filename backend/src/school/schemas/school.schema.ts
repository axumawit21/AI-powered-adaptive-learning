import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SchoolDocument = School & Document;

@Schema({ timestamps: true })
export class School {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  code: string; // e.g., "ABC-001"

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  phone?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  expiresAt?: Date; // Trial expiration

  @Prop()
  maxStudents?: number; // Limit for testing

  @Prop({ default: () => `SCH-${Date.now()}` })
  schoolId: string;
}

export const SchoolSchema = SchemaFactory.createForClass(School);
