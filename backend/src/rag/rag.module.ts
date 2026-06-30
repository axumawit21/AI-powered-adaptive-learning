import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { Book, BookSchema } from '../books/book.schema';

// Services
import { RetrievalService } from './services/retrieval.service';
import { EnhancedChunkingService } from './services/enhanced-chunking.service';
import { TermExtractionService } from './services/term-extraction.service';
import { VisionAnalysisService } from './services/vision-analysis.service';

// Providers
import { qdrantProvider } from '../common/qdrant.provider';

// Dependencies
import { LlmModule } from '../llm/llm.module';

/**
 * RAGModule
 * 
 * Central module for all Retrieval-Augmented Generation functionality:
 * - Enhanced chunking with contextual headers
 * - Sliding window retrieval
 * - Hybrid search (semantic + keyword)
 * - Vision analysis for images
 * - Term extraction for hybrid search
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
    ]),
    LlmModule,
  ],
  providers: [
    qdrantProvider,
    RetrievalService,
    EnhancedChunkingService,
    TermExtractionService,
    VisionAnalysisService,
  ],
  exports: [
    RetrievalService,
    EnhancedChunkingService,
    TermExtractionService,
    VisionAnalysisService,
  ],
})
export class RagModule {}
