import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NoteDocument = Note & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Note {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Student' })
  studentId: Types.ObjectId;

  @Prop({ required: true, maxlength: 200 })
  title: string;

  @Prop({ required: true, maxlength: 5000 })
  content: string;

  @Prop()
  subject?: string;

  @Prop()
  unit?: string;

  @Prop({ default: '#64748b' })
  color: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: false })
  isPinned: boolean;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({
    type: {
      date: { type: Date, required: true },
      notified: { type: Boolean, default: false },
      recurring: { type: String, enum: ['daily', 'weekly', 'monthly', null], default: null },
      snoozedUntil: { type: Date, default: null }
    },
    default: null
  })
  reminder?: {
    date: Date;
    notified: boolean;
    recurring?: 'daily' | 'weekly' | 'monthly' | null;
    snoozedUntil?: Date | null;
  };
}

export const NoteSchema = SchemaFactory.createForClass(Note);

// Create indexes
NoteSchema.index({ studentId: 1 });
NoteSchema.index({ 'reminder.date': 1 });
NoteSchema.index({ createdAt: -1 });
NoteSchema.index({ title: 'text', content: 'text' });
