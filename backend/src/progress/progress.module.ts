import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { Progress, ProgressSchema } from './progress.schema';
import { ExamSession, ExamSessionSchema } from '../exam/schemas/exam-session.schema';

import { LlmModule } from '../llm/llm.module';
import { GamificationModule } from '../gamification/gamification.module';
import { BooksModule } from '../books/books.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Progress.name, schema: ProgressSchema }]),
    MongooseModule.forFeature([{ name: ExamSession.name, schema: ExamSessionSchema }]),
    LlmModule,
    GamificationModule,
    BooksModule,
  ],
  providers: [ProgressService],
  controllers: [ProgressController],
  exports: [ProgressService],
})
export class ProgressModule {}
