import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { School, SchoolSchema } from './schemas/school.schema';
import { Section, SectionSchema } from './schemas/section.schema';
import { Student, StudentSchema } from '../students/student.schema';
import { TeacherUser, TeacherUserSchema } from '../teacher/teacher-user.schema';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { TeacherModule } from '../teacher/teacher.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: School.name, schema: SchoolSchema },
      { name: Section.name, schema: SectionSchema },
      { name: Student.name, schema: StudentSchema },
      { name: TeacherUser.name, schema: TeacherUserSchema },
    ]),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for CSV
      },
    }),
    TeacherModule,
  ],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}

