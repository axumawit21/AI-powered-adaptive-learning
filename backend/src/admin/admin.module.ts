import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin, AdminSchema } from './admin.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminTeacherController } from './admin-teacher.controller';
import { AdminTeacherService } from './admin-teacher.service';
import { SuperAdminController } from './super-admin.controller';
import { TeachersController } from './teachers.controller';
import { Question, QuestionSchema } from '../question-bank/schemas/question.schema';
import { TeacherModule } from '../teacher/teacher.module';

@Module({
  imports: [
    TeacherModule, // Import to access TeacherUserService
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AdminService, AdminTeacherService],
  controllers: [AdminController, AdminTeacherController, SuperAdminController, TeachersController],
  exports: [AdminService, AdminTeacherService],
})
export class AdminModule {}

