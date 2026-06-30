import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { School, SchoolDocument } from './schemas/school.schema';
import { Section, SectionDocument } from './schemas/section.schema';
import { 
  CreateSchoolDto, 
  UpdateSchoolDto, 
  CreateSectionDto, 
  UpdateSectionDto,
  BulkImportStudentDto,
  BulkImportResultDto 
} from './dto/school.dto';

@Injectable()
export class SchoolService {
  private readonly logger = new Logger(SchoolService.name);

  constructor(
    @InjectModel(School.name) private schoolModel: Model<SchoolDocument>,
    @InjectModel(Section.name) private sectionModel: Model<SectionDocument>,
    @InjectModel('Student') private studentModel: Model<any>,
    @InjectModel('TeacherUser') private teacherUserModel: Model<any>,
  ) {}

  // ==================== SCHOOL CRUD ====================

  async createSchool(dto: CreateSchoolDto): Promise<SchoolDocument> {
    const existing = await this.schoolModel.findOne({ code: dto.code });
    if (existing) {
      throw new ConflictException(`School with code ${dto.code} already exists`);
    }

    const school = new this.schoolModel(dto);
    const saved = await school.save();
    this.logger.log(`Created school: ${saved.name} (${saved.code})`);
    return saved;
  }

  async findAllSchools(): Promise<SchoolDocument[]> {
    return this.schoolModel.find().sort({ name: 1 }).exec();
  }

  async findSchoolById(id: string): Promise<SchoolDocument> {
    const school = await this.schoolModel.findById(id);
    if (!school) {
      throw new NotFoundException(`School not found: ${id}`);
    }
    return school;
  }

  async findSchoolByCode(code: string): Promise<SchoolDocument> {
    const school = await this.schoolModel.findOne({ code });
    if (!school) {
      throw new NotFoundException(`School not found: ${code}`);
    }
    return school;
  }

  async updateSchool(id: string, dto: UpdateSchoolDto): Promise<SchoolDocument> {
    const school = await this.schoolModel.findByIdAndUpdate(id, dto, { new: true });
    if (!school) {
      throw new NotFoundException(`School not found: ${id}`);
    }
    this.logger.log(`Updated school: ${school.name}`);
    return school;
  }

  async deleteSchool(id: string): Promise<void> {
    const result = await this.schoolModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`School not found: ${id}`);
    }
    this.logger.log(`Deleted school: ${result.name}`);
  }

  // ==================== SECTION CRUD ====================

  async createSection(dto: CreateSectionDto): Promise<SectionDocument> {
    const section = new this.sectionModel({
      name: dto.name,
      schoolId: new Types.ObjectId(dto.schoolId),
      gradeId: new Types.ObjectId(dto.gradeId),
      homeroomTeacherId: dto.homeroomTeacherId ? new Types.ObjectId(dto.homeroomTeacherId) : undefined,
    });

    try {
      const saved = await section.save();
      this.logger.log(`Created section: ${saved.name} for school ${dto.schoolId}`);
      return saved;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(`Section ${dto.name} already exists in this school`);
      }
      throw error;
    }
  }

  async findSectionsBySchool(schoolId: string): Promise<SectionDocument[]> {
    return this.sectionModel
      .find({ schoolId: new Types.ObjectId(schoolId) })
      .populate('gradeId', 'title number')
      .populate('homeroomTeacherId', 'name email')
      .sort({ name: 1 })
      .exec();
  }

  async findSectionById(id: string): Promise<SectionDocument> {
    const section = await this.sectionModel.findById(id)
      .populate('gradeId', 'title number')
      .populate('homeroomTeacherId', 'name email');
    if (!section) {
      throw new NotFoundException(`Section not found: ${id}`);
    }
    return section;
  }

  async updateSection(id: string, dto: UpdateSectionDto): Promise<SectionDocument> {
    const updateData: any = { ...dto };
    if (dto.homeroomTeacherId) {
      updateData.homeroomTeacherId = new Types.ObjectId(dto.homeroomTeacherId);
    }

    const section = await this.sectionModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!section) {
      throw new NotFoundException(`Section not found: ${id}`);
    }
    return section;
  }

  async deleteSection(id: string): Promise<void> {
    const result = await this.sectionModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Section not found: ${id}`);
    }
  }

  // ==================== BULK IMPORT ====================

  async bulkImportStudents(
    schoolId: string,
    students: BulkImportStudentDto[],
  ): Promise<BulkImportResultDto> {
    const school = await this.findSchoolById(schoolId);
    
    // Check max students limit
    if (school.maxStudents) {
      const currentCount = await this.studentModel.countDocuments({ schoolId: new Types.ObjectId(schoolId) });
      if (currentCount + students.length > school.maxStudents) {
        throw new BadRequestException(
          `Cannot import ${students.length} students. School limit is ${school.maxStudents}, current: ${currentCount}`
        );
      }
    }

    const result: BulkImportResultDto = {
      total: students.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Get all sections for this school for lookup
    const sections = await this.sectionModel.find({ schoolId: new Types.ObjectId(schoolId) });
    const sectionMap = new Map(sections.map(s => [s.name, s._id]));

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      try {
        // Check if email already exists
        const existing = await this.studentModel.findOne({ email: student.email });
        if (existing) {
          result.errors.push({ row: i + 1, email: student.email, error: 'Email already exists' });
          result.failed++;
          continue;
        }

        // Generate password if not provided
        const password = student.password || this.generateDefaultPassword();
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // Find section if provided
        let sectionId: Types.ObjectId | undefined;
        if (student.sectionName) {
          const foundSection = sectionMap.get(student.sectionName);
          if (!foundSection) {
            result.errors.push({ row: i + 1, email: student.email, error: `Section ${student.sectionName} not found` });
            result.failed++;
            continue;
          }
          sectionId = foundSection as Types.ObjectId;
        }

        // Create student
        await this.studentModel.create({
          email: student.email,
          name: student.name,
          password: hashedPassword,
          role: 'student',
          schoolId: new Types.ObjectId(schoolId),
          sectionId,
        });

        result.successful++;
      } catch (error) {
        result.errors.push({ row: i + 1, email: student.email, error: error.message });
        result.failed++;
      }
    }

    this.logger.log(`Bulk import for school ${school.name}: ${result.successful} success, ${result.failed} failed`);
    return result;
  }

  private generateDefaultPassword(): string {
    return `Temp${Math.random().toString(36).substring(2, 8)}!`;
  }

  // ==================== ANALYTICS ====================

  async getSchoolStats(schoolId: string): Promise<{
    totalStudents: number;
    totalTeachers: number;
    totalSections: number;
    studentsBySection: { section: string; count: number }[];
  }> {
    const schoolObjId = new Types.ObjectId(schoolId);

    const [totalStudents, totalTeachers, totalSections, studentsBySection] = await Promise.all([
      this.studentModel.countDocuments({ schoolId: schoolObjId }),
      this.teacherUserModel.countDocuments({ schoolId: schoolObjId }),
      this.sectionModel.countDocuments({ schoolId: schoolObjId }),
      this.studentModel.aggregate([
        { $match: { schoolId: schoolObjId } },
        { $group: { _id: '$sectionId', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'sections',
            localField: '_id',
            foreignField: '_id',
            as: 'section',
          },
        },
        { $unwind: { path: '$section', preserveNullAndEmptyArrays: true } },
        { $project: { section: { $ifNull: ['$section.name', 'Unassigned'] }, count: 1 } },
      ]),
    ]);

    return {
      totalStudents,
      totalTeachers,
      totalSections,
      studentsBySection: studentsBySection.map((s) => ({ section: s.section, count: s.count })),
    };
  }
}
