import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizController } from './quiz.controller';
import { Quiz, QuizSchema } from './quiz.schema';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { Subject, SubjectSchema } from '../subjects/subjects.schema';
import { QuizService } from './quiz.service';
import { QuizSessionController } from './quiz-session.controller';
import { QuizSessionService } from './quiz-session.service';
import { EnhancedQuizController } from './enhanced-quiz.controller';
import { EnhancedQuizService } from './enhanced-quiz.service';

import { qdrantProvider } from '../common/qdrant.provider';

import { LlmModule } from '../llm/llm.module';
import { ProgressModule } from '../progress/progress.module';
import { QuestionBankModule } from '../question-bank/question-bank.module';
import { BooksModule } from '../books/books.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quiz.name, schema: QuizSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
    LlmModule,
    ProgressModule,
    BooksModule,
    RagModule,
    forwardRef(() => QuestionBankModule),
  ],
  controllers: [QuizController, QuizSessionController, EnhancedQuizController],
  providers: [QuizService, QuizSessionService, EnhancedQuizService, qdrantProvider],
  exports: [QuizService, EnhancedQuizService],
})
export class QuizModule {}
