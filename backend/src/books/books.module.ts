
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Book, BookSchema } from './book.schema';
import { PreprocessService } from './preprocess.service';
import { qdrantProvider } from '../common/qdrant.provider';
import { PreprocessController } from './preprocess.controller';
import { GradesModule } from '../grades/grades.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { RagModule } from '../rag/rag.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
    GradesModule,
    SubjectsModule,
    RagModule, // Enhanced RAG preprocessing
  ],
  controllers: [BooksController, PreprocessController],
  providers: [BooksService, PreprocessService, qdrantProvider],
  exports: [PreprocessService, MongooseModule, BooksService],
})
export class BooksModule {}

