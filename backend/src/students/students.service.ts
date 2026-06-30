import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student } from './student.schema';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>,
  ) {}

  async create(createStudentDto: Partial<Student>): Promise<Student> {
    const createdStudent = new this.studentModel(createStudentDto);
    return createdStudent.save();
  }

  async findAll(page: number = 1, limit: number = 50): Promise<PaginatedResult<Student>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.studentModel.find().skip(skip).limit(limit).exec(),
      this.studentModel.countDocuments().exec(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Student | null> {
    return this.studentModel.findById(id).exec();
  }

  async findOneOrFail(id: string): Promise<Student> {
    const student = await this.findOne(id);
    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
    return student;
  }

  async update(id: string, updateStudentDto: Partial<Student>): Promise<Student | null> {
    const updated = await this.studentModel
      .findByIdAndUpdate(id, updateStudentDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<Student | null> {
    const deleted = await this.studentModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }
    return deleted;
  }

  async findByEmail(email: string): Promise<Student | null> {
    return this.studentModel.findOne({ email }).exec();
  }

  async updateProfile(id: string, profileDto: { name?: string; avatarUrl?: string }): Promise<Student | null> {
    const updateData: Partial<Student> = {};
    if (profileDto.name) updateData.name = profileDto.name;
    // Add other profile fields as needed
    
    return this.studentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();
  }

  async updateApiKey(id: string, geminiApiKey: string | null): Promise<void> {
    if (geminiApiKey) {
      await this.studentModel.findByIdAndUpdate(id, { geminiApiKey }).exec();
    } else {
      await this.studentModel.findByIdAndUpdate(id, { $unset: { geminiApiKey: 1 } }).exec();
    }
  }
}