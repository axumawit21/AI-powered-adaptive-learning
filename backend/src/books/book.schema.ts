import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {  Unit } from './book-structures/book-structure.types';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';

@Schema({ timestamps: true })
export class Book extends Document {
  
  @Prop({ required: true })
  title: string;

   // Reference to Grade
  @Prop({ type: Types.ObjectId, ref: 'Grade', required: true })
  grade: Types.ObjectId | Grade;

  // Reference to Subject
  @Prop({ type: Types.ObjectId, ref: 'Subject', required: true })
  subject: Types.ObjectId | Subject;

  @Prop()
  content: string;

  @Prop()
  filePath: string;

  @Prop()
  fileUrl: string;

  @Prop({ default: 'admin' })
  uploadedBy: string; // later we can link to user

  @Prop({ default: [] })
  embeddings: number[]; // placeholder for future RAG
  
  @Prop({ type: Array, default: [] })
   units: Unit[];

  @Prop({ default: false })
  isPreprocessed: boolean; // Track if book has been preprocessed to Qdrant

  @Prop({ default: 0 })
  pageOffset: number; // Adjustment for PDF vs Printed page numbers (e.g. if PDF pg 5 is Book pg 1, offset = 4)
}

export const BookSchema = SchemaFactory.createForClass(Book);

export type BookDocument = Book & Document & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};