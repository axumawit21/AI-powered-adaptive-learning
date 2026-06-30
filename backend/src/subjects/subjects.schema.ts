// subjects.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // automatically adds createdAt & updatedAt
export class Subject {
  @Prop({ required: true, unique: true })
  title: string; // subject title, e.g., "Mathematics", "Physics"
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);

// TypeScript type for Mongoose document
export type SubjectDocument = Subject & Document;
