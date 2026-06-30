import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LlmService } from './llm.service';
import { ApiKeyMiddleware } from './api-key.middleware';
import { Student, StudentSchema } from '../students/student.schema';
import { TeacherUser, TeacherUserSchema } from '../teacher/teacher-user.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: TeacherUser.name, schema: TeacherUserSchema },
    ]),
  ],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply API key middleware to all routes — it silently injects per-user keys
    consumer.apply(ApiKeyMiddleware).forRoutes('*');
  }
}
