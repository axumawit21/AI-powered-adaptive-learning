import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Grade, GradeDocument } from './grades.schema';

@Injectable()
export class GradesService {
  // Cache — grades rarely change but are queried on every page load
  private gradesCache: { data: any[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 300_000; // 5 minutes

  constructor(@InjectModel(Grade.name) private gradeModel: Model<GradeDocument>) {}

  /** ---------------- Create a new grade ---------------- */
  async create(data: { title: string; gradeNumber: number }): Promise<GradeDocument> {
    this.gradesCache = null; // Invalidate cache on write
    const grade = new this.gradeModel(data);
    return grade.save();
  }

  /** ---------------- Get all grades (cached) ---------------- */
  async findAll(): Promise<any[]> {
    if (this.gradesCache && Date.now() - this.gradesCache.timestamp < this.CACHE_TTL) {
      return this.gradesCache.data;
    }
    const data = await this.gradeModel.find().sort({ gradeNumber: 1 }).lean().exec();
    this.gradesCache = { data, timestamp: Date.now() };
    return data;
  }

  /** ---------------- Get a grade by ID ---------------- */
  async findById(id: string): Promise<GradeDocument> {
    const grade = await this.gradeModel.findById(id);
    if (!grade) throw new NotFoundException('Grade not found');
    return grade;
  }

  /** ---------------- Update a grade ---------------- */
  async update(
    id: string,
    data: Partial<{ title: string; gradeNumber: number }>,
  ): Promise<GradeDocument> {
    this.gradesCache = null; // Invalidate cache
    const updated = await this.gradeModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Grade not found');
    return updated;
  }

  /** ---------------- Delete a grade ---------------- */
  async delete(id: string) {
    this.gradesCache = null; // Invalidate cache
    const deleted = await this.gradeModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Grade not found');
    return { message: 'Grade deleted successfully' };
  }
}
