import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { TeacherGuard } from './teacher.guard';
import { TeacherUserService } from './teacher-user.service';
import { TeacherUser, TeacherUserSchema } from './teacher-user.schema';
import { Question, QuestionSchema } from '../question-bank/schemas/question.schema';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { Subject, SubjectSchema } from '../subjects/subjects.schema';
import { Book, BookSchema } from '../books/book.schema';
import { TeacherExamBank, TeacherExamBankSchema } from './schemas/teacher-exam-bank.schema';
import { TeacherExam, TeacherExamSchema } from './schemas/teacher-exam.schema';
import { Summary, SummarySchema } from '../summary/schemas/summary.schema';
import { ModelExam, ModelExamSchema } from '../national-exam/schemas/model-exam.schema';
import { LlmModule } from '../llm/llm.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeacherUser.name, schema: TeacherUserSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Book.name, schema: BookSchema },
      { name: TeacherExamBank.name, schema: TeacherExamBankSchema },
      { name: TeacherExam.name, schema: TeacherExamSchema },
      { name: Summary.name, schema: SummarySchema },
      { name: ModelExam.name, schema: ModelExamSchema },
    ]),
    LlmModule,
    RagModule,
  ],
  controllers: [TeacherController],
  providers: [TeacherService, TeacherGuard, TeacherUserService],
  exports: [TeacherService, TeacherUserService, MongooseModule],
})
export class TeacherModule {}
