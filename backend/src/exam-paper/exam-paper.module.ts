import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamPaperController } from './exam-paper.controller';
import { ExamPaperService } from './exam-paper.service';
import { ExamPaper, ExamPaperSchema } from './schemas/exam-paper.schema';
import { ExamPaperQuestion, ExamPaperQuestionSchema } from './schemas/exam-paper-question.schema';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { Subject, SubjectSchema } from '../subjects/subjects.schema';
import { LlmModule } from '../llm/llm.module';
import { StudentUploadModule } from '../student-upload/student-upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamPaper.name, schema: ExamPaperSchema },
      { name: ExamPaperQuestion.name, schema: ExamPaperQuestionSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
    LlmModule,
    StudentUploadModule,
  ],
  controllers: [ExamPaperController],
  providers: [ExamPaperService],
  exports: [ExamPaperService],
})
export class ExamPaperModule {}
