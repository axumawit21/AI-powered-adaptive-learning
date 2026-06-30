import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from '../books/book.schema';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { Subject, SubjectSchema } from '../subjects/subjects.schema';
import { SummarizeService } from './summarize.service';
import { SummarizeController } from './summary.controller';
import { qdrantProvider } from '../common/qdrant.provider';
import { LlmModule } from '../llm/llm.module';
import { Summary, SummarySchema } from './schemas/summary.schema';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Summary.name, schema: SummarySchema },
    ]),
    LlmModule,
    RagModule,
  ],
  controllers: [SummarizeController],
  providers: [SummarizeService, qdrantProvider],
  exports: [SummarizeService],
})
export class SummarizeModule {}

