import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class StudentStats {
  @Prop({ type: String, ref: 'Student', required: true, unique: true, index: true })
  studentId: string;

  @Prop({ default: 0 })
  totalPoints: number;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop()
  lastActivityDate: Date;

  @Prop({ type: [String], default: [] })
  activityDates: string[]; // ISO date strings

  @Prop({ default: 0 })
  quizzesCompleted: number;

  @Prop({ default: 0 })
  examsCompleted: number;

  @Prop({ default: 0 })
  totalStudyMinutes: number;

  @Prop({ default: 1 })
  level: number;
}

export type StudentStatsDocument = StudentStats & Document;
export const StudentStatsSchema = SchemaFactory.createForClass(StudentStats);

@Schema({ timestamps: true })
export class StudentAchievement {
  @Prop({ type: String, ref: 'Student', required: true, index: true })
  studentId: string;

  @Prop({ required: true })
  achievementId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  points: number;

  @Prop({ default: Date.now })
  unlockedAt: Date;
}

export type StudentAchievementDocument = StudentAchievement & Document;
export const StudentAchievementSchema = SchemaFactory.createForClass(StudentAchievement);

@Schema({ timestamps: true })
export class Goal {
  @Prop({ type: String, ref: 'Student', required: true, index: true })
  studentId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  timeframe: string;

  @Prop({ required: true, enum: ['study_time', 'quizzes', 'exams', 'units', 'custom'] })
  type: string;

  @Prop({ required: true })
  targetValue: number;

  @Prop({ default: 0 })
  currentValue: number;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ default: 'active', enum: ['active', 'completed', 'failed', 'paused'] })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Subject' })
  subjectId: Types.ObjectId;

  @Prop()
  subjectTitle: string;
}

export type GoalDocument = Goal & Document;
export const GoalSchema = SchemaFactory.createForClass(Goal);
