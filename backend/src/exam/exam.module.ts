import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { EnhancedExamController } from './enhanced-exam.controller';
import { EnhancedExamService } from './enhanced-exam.service';
import { ExamSession, ExamSessionSchema } from './schemas/exam-session.schema';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { Subject, SubjectSchema } from '../subjects/subjects.schema';
import { ProgressModule } from '../progress/progress.module';
import { qdrantProvider } from '../common/qdrant.provider';

import { LlmModule } from '../llm/llm.module';
import { QuestionBankModule } from '../question-bank/question-bank.module';
import { BooksModule } from '../books/books.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExamSession.name, schema: ExamSessionSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
    ProgressModule,
    LlmModule,
    BooksModule,
    RagModule,
    forwardRef(() => QuestionBankModule),
  ],
  controllers: [ExamController, EnhancedExamController],
  providers: [ExamService, EnhancedExamService, qdrantProvider],
  exports: [ExamService, EnhancedExamService],
})
export class ExamModule {}

