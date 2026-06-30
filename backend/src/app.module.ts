import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { BooksModule } from './books/books.module';
import { StudentsModule } from './students/students.module';
import { ProgressModule } from './progress/progress.module';
import { ChatModule } from './chat/chat.module';
import { SummarizeModule } from './summary/summary.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';
import { QuizModule } from './quiz/quiz.module';
import { GradesModule } from './grades/grades.module';
import { SubjectsModule } from './subjects/subjects.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ExamModule } from './exam/exam.module';
import { NotesModule } from './notes/notes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GamificationModule } from './gamification/gamification.module';
import { PresentationModule } from './presentation/presentation.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { ContentModerationModule } from './content-moderation/content-moderation.module';
import { TtsModule } from './tts/tts.module';
import { StudentUploadModule } from './student-upload/student-upload.module';
import { TeacherModule } from './teacher/teacher.module';
import { ExamPaperModule } from './exam-paper/exam-paper.module';
import { NationalExamModule } from './national-exam/national-exam.module';
import { SchoolModule } from './school/school.module';

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per minute for general endpoints
    }]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        // Connection pool — sized for 1000 concurrent users
        maxPoolSize: 200,           // Max connections (up from 100)
        minPoolSize: 20,            // Keep 20 warm connections ready
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,    // Fail fast on connection issues
        socketTimeoutMS: 30000,     // Release idle connections faster (was 45s)
        retryWrites: true,
        w: 'majority',
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    BooksModule,
    StudentsModule,
    ProgressModule,
    ChatModule,
    SummarizeModule,
    QuizModule,
    GradesModule,
    SubjectsModule,
    AuthModule,
    AdminModule,
    AnalyticsModule,
    ExamModule,
    NotesModule,
    NotificationsModule,
    GamificationModule,
    PresentationModule,
    QuestionBankModule,
    ContentModerationModule,
    TtsModule,
    StudentUploadModule,
    TeacherModule,
    ExamPaperModule,
    NationalExamModule,
    SchoolModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
