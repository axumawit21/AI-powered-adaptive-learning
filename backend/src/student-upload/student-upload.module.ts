import { Module, forwardRef } from '@nestjs/common';
import { StudentUploadController } from './student-upload.controller';
import { StudentUploadService } from './student-upload.service';
import { SessionStoreService } from './session-store.service';
import { OcrProcessor } from './processors/ocr.processor';
import { PdfProcessor } from './processors/pdf.processor';
import { LlmModule } from '../llm/llm.module';
import { ChatModule } from '../chat/chat.module';
import { RagModule } from '../rag/rag.module';
import { BooksModule } from '../books/books.module';
import { GradesModule } from '../grades/grades.module';
import { SubjectsModule } from '../subjects/subjects.module';

@Module({
  imports: [LlmModule, forwardRef(() => ChatModule), RagModule, BooksModule, GradesModule, SubjectsModule],
  controllers: [StudentUploadController],
  providers: [
    StudentUploadService,
    SessionStoreService,
    OcrProcessor,
    PdfProcessor,
  ],
  exports: [StudentUploadService, SessionStoreService, PdfProcessor, OcrProcessor],
})
export class StudentUploadModule {}
