import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TeacherUser, TeacherUserDocument } from './teacher-user.schema';

@Injectable()
export class TeacherUserService {
  constructor(
    @InjectModel(TeacherUser.name) private teacherUserModel: Model<TeacherUserDocument>,
  ) {}

  async create(createTeacherDto: Partial<TeacherUser>): Promise<TeacherUserDocument> {
    const createdTeacher = new this.teacherUserModel(createTeacherDto);
    return createdTeacher.save();
  }

  async findAll(page: number = 1, limit: number = 50): Promise<{
    data: TeacherUserDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.teacherUserModel.find()
        .select('-password')
        .populate('gradeId', 'title')
        .populate('subjectId', 'title')
        .populate('schoolId', 'name')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.teacherUserModel.countDocuments().exec(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySchool(schoolId: string, page: number = 1, limit: number = 50): Promise<{
    data: TeacherUserDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    // Convert schoolId string to ObjectId for proper MongoDB matching
    const schoolObjectId = new Types.ObjectId(schoolId);
    const filter = { schoolId: schoolObjectId };
    const [data, total] = await Promise.all([
      this.teacherUserModel.find(filter)
        .select('-password')
        .populate('gradeId', 'title')
        .populate('subjectId', 'title')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.teacherUserModel.countDocuments(filter).exec(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<TeacherUserDocument | null> {
    return this.teacherUserModel.findById(id).exec();
  }

  async findOneOrFail(id: string): Promise<TeacherUserDocument> {
    const teacher = await this.findOne(id);
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID "${id}" not found`);
    }
    return teacher;
  }

  async findByEmail(email: string): Promise<TeacherUserDocument | null> {
    return this.teacherUserModel.findOne({ email }).exec();
  }

  async update(id: string, updateTeacherDto: Partial<TeacherUser>): Promise<TeacherUserDocument | null> {
    const updated = await this.teacherUserModel
      .findByIdAndUpdate(id, updateTeacherDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Teacher with ID "${id}" not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<TeacherUserDocument | null> {
    const deleted = await this.teacherUserModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Teacher with ID "${id}" not found`);
    }
    return deleted;
  }

  async updateApiKey(id: string, geminiApiKey: string | null): Promise<void> {
    if (geminiApiKey) {
      await this.teacherUserModel.findByIdAndUpdate(id, { geminiApiKey }).exec();
    } else {
      await this.teacherUserModel.findByIdAndUpdate(id, { $unset: { geminiApiKey: 1 } }).exec();
    }
  }
}
