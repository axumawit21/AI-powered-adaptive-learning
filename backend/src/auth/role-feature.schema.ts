import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleFeatureDocument = RoleFeature & Document;

/**
 * Role Feature Schema - Stores dynamic feature/permission mappings per role
 * This allows super admins to add/remove features from any role at runtime
 */
@Schema({ timestamps: true })
export class RoleFeature {
  @Prop({ required: true, unique: true })
  role: string; // 'super_admin', 'admin', 'school_admin', 'content_moderator', 'teacher', 'student'

  @Prop({ type: [String], default: [] })
  features: string[]; // Feature IDs: ['dashboard', 'students', 'grades', 'books', etc.]

  @Prop({ type: [String], default: [] })
  permissions: string[]; // Granular permissions: ['dashboard.view', 'students.edit', etc.]

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String })
  description?: string; // Optional description for the role
}

export const RoleFeatureSchema = SchemaFactory.createForClass(RoleFeature);

// Default feature mappings - used to seed the database
export const DEFAULT_ROLE_FEATURES = {
  super_admin: {
    features: ['*'], // Wildcard = all features
    permissions: ['*'],
    description: 'Full platform access - can manage everything',
  },
  admin: {
    features: ['*'],
    permissions: ['*'],
    description: 'Legacy admin role - same as super_admin',
  },
  school_admin: {
    features: ['schoolDashboard', 'schoolStudents', 'sections', 'bulkImport'],
    permissions: ['school.dashboard', 'school.students', 'sections.view', 'students.import'],
    description: 'School-level management - students, sections, imports',
  },
  content_moderator: {
    features: ['dashboard', 'contentModeration', 'questionBank'],
    permissions: ['dashboard.view', 'content.moderate', 'questions.view', 'questions.edit'],
    description: 'Content review and moderation',
  },
  teacher: {
    features: ['dashboard', 'questions', 'aiTools'],
    permissions: ['dashboard.view', 'questions.create', 'questions.view', 'exams.create'],
    description: 'Teacher-specific features - question creation and AI tools',
  },
  student: {
    features: ['dashboard', 'chat', 'quiz', 'progress', 'notes', 'exams', 'gamification'],
    permissions: ['dashboard.view', 'chat.access', 'quiz.generate', 'progress.view', 'notes.manage', 'exams.take'],
    description: 'Student learning features',
  },
};
