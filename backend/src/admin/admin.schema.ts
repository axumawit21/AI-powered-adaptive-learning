import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminDocument = Admin & Document;

export type AdminRole = 'super_admin' | 'content_moderator' | 'school_admin';

@Schema({ timestamps: true })
export class Admin {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ 
    enum: ['super_admin', 'content_moderator', 'school_admin', 'admin'], 
    default: 'admin',
    index: true, // Index for faster role-based queries and aggregations
  })
  role: string;

  // Only for school_admin role
  @Prop({ type: Types.ObjectId, ref: 'School' })
  schoolId?: Types.ObjectId;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
