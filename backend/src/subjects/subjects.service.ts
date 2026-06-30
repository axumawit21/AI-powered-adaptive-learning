import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from './subjects.schema';

@Injectable()
export class SubjectsService {
  // Cache — subjects rarely change but are queried on every page load
  private subjectsCache: { data: any[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 300_000; // 5 minutes

  constructor(@InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>) {}

  /** ---------------- Create a new subject ---------------- */
  async create(data: { title: string }): Promise<SubjectDocument> {
    this.subjectsCache = null; // Invalidate cache on write
    const subject = new this.subjectModel(data);
    return subject.save();
  }

  /** ---------------- Get all subjects (cached) ---------------- */
  async findAll(): Promise<any[]> {
    if (this.subjectsCache && Date.now() - this.subjectsCache.timestamp < this.CACHE_TTL) {
      return this.subjectsCache.data;
    }
    const data = await this.subjectModel.find().sort({ title: 1 }).lean().exec();
    this.subjectsCache = { data, timestamp: Date.now() };
    return data;
  }

  /** ---------------- Get a subject by ID ---------------- */
  async findById(id: string): Promise<SubjectDocument> {
    const subject = await this.subjectModel.findById(id);
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  /** ---------------- Update a subject ---------------- */
  async update(id: string, data: Partial<{ title: string }>): Promise<SubjectDocument> {
    this.subjectsCache = null; // Invalidate cache
    const updated = await this.subjectModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Subject not found');
    return updated;
  }

  /** ---------------- Delete a subject ---------------- */
  async delete(id: string) {
    this.subjectsCache = null; // Invalidate cache
    const deleted = await this.subjectModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Subject not found');
    return { message: 'Subject deleted successfully' };
  }
}
