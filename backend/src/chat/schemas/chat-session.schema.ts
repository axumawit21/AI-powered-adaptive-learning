import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatSessionDocument = ChatSession & Document;

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Student', index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  grade?: string;

  @Prop()
  subject?: string;

  @Prop({
    type: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        context: { type: Object }, // Optional context like gradeId, subjectId
      },
    ],
    default: [],
  })
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: any;
  }[];
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
