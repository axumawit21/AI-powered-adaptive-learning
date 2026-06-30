import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';
import { AskAIController } from './ask-ai.controller';
import { AskAIService } from './ask-ai.service';
import { Question, QuestionSchema } from './schemas/question.schema';
import { StudentAttemptedQuestions, StudentAttemptedQuestionsSchema } from './schemas/student-attempted-questions.schema';
import { GradesModule } from '../grades/grades.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { BooksModule } from '../books/books.module';
import { LlmModule } from '../llm/llm.module';
import { RagModule } from '../rag/rag.module';
import { qdrantProvider } from '../common/qdrant.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: StudentAttemptedQuestions.name, schema: StudentAttemptedQuestionsSchema },
    ]),
    GradesModule,
    SubjectsModule,
    forwardRef(() => BooksModule),
    LlmModule,
    RagModule,
  ],
  controllers: [QuestionBankController, AskAIController],
  providers: [QuestionBankService, AskAIService, qdrantProvider],
  exports: [QuestionBankService, MongooseModule],
})
export class QuestionBankModule {}
