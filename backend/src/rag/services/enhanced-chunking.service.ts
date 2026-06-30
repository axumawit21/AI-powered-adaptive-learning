import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QdrantClient } from '@qdrant/js-client-rest';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';

import { Book } from '../../books/book.schema';
import { QDRANT } from '../../common/qdrant.provider';
import { LlmService } from '../../llm/llm.service';
import { TermExtractionService } from './term-extraction.service';
import { EnhancedChunkPayload } from '../interfaces/chunk-payload.interface';

/**
 * EnhancedChunkingService
 * 
 * Replaces the basic chunking in preprocess.service.ts with:
 * - Contextual headers (Grade - Subject - Unit - Section)
 * - Chunk linking (prev/next IDs for sliding window)
 * - Key term extraction for hybrid search
 * - Deduplication via content hashing
 */
@Injectable()
export class EnhancedChunkingService {
  private readonly logger = new Logger(EnhancedChunkingService.name);

  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @Inject(QDRANT) private readonly qdrant: QdrantClient,
    private readonly llmService: LlmService,
    private readonly termExtractionService: TermExtractionService,
  ) {}

  /**
   * Main preprocessing entry with enhanced chunking
   */
  async preprocessBookEnhanced(bookId: string): Promise<{
    message: string;
    totalPoints: number;
    collectionName: string;
  }> {
    // 1. Fetch book with populated grade/subject
    const book = await this.bookModel
      .findById(bookId)
      .populate('grade')
      .populate('subject')
      .exec();

    if (!book) throw new Error('Book not found');

    const fullPath = path.resolve(book.filePath);
    if (!fs.existsSync(fullPath)) throw new Error('File not found on disk');

    // 2. Extract text with PAGE PRESERVATION
    let content = '';
    const pageDelim = '\f'; // Form feed as page delimiter
    
    if (fullPath.endsWith('.pdf')) {
      const buffer = fs.readFileSync(fullPath);
      
      // Custom render to preserve page breaks
      const options = {
        pagerender: async (pageData: any) => {
          // Default text extraction logic from pdf-parse
          const textContent = await pageData.getTextContent();
          let lastY, text = '';
          for (const item of textContent.items) {
            if (lastY == item.transform[5] || !lastY){
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          return text + pageDelim; // Append delimiter
        }
      } as any; // Type casting as pdf-parse types might be incomplete

      const data = await pdfParse(buffer, options);
      content = data.text;
    } else {
      // For txt/md files, assume entire file is one page or split by delimiters if present
      content = fs.readFileSync(fullPath, 'utf-8');
    }

    this.logger.log(`📄 Book content length: ${content.length}`);

    // 3. Validate Structure
    if (!book.units || !Array.isArray(book.units) || book.units.length === 0) {
      throw new Error(
        `❌ No book structure found for "${book.title}". Please define units in the Admin Portal first.`,
      );
    }

    // 4. Get titles
    const gradeTitle = (book.grade as any).title || 'UnknownGrade';
    const subjectTitle = (book.subject as any).title || 'UnknownSubject';
    const gradeId = (book.grade as any)._id.toString();
    const subjectId = (book.subject as any)._id.toString();
    const bookIdStr = (book as any)._id.toString();

    // 5. Create enhanced chunks with linking
    const allChunks = await this.createEnhancedChunks(
      content,
      book.units,
      {
        bookId: bookIdStr,
        gradeId,
        subjectId,
        gradeTitle,
        subjectTitle,
        pageOffset: (book as any).pageOffset || 0,
      },
    );


    this.logger.log(`📦 Created ${allChunks.length} enhanced chunks`);

    // 6. Collection setup
    const collectionName = this.getCollectionName(gradeTitle, subjectTitle);
    await this.ensureQdrantCollection(collectionName);

    // 7. Generate embeddings and upload
    const totalPoints = await this.uploadChunksToQdrant(
      collectionName,
      allChunks,
    );

    this.logger.log(
      `🎉 Finished enhanced preprocessing "${book.title}" (${totalPoints} total chunks)`,
    );

    // 8. Mark book as preprocessed
    book.isPreprocessed = true;
    await book.save();

    return {
      message: 'Enhanced preprocessing completed successfully',
      totalPoints,
      collectionName,
    };
  }

  /**
   * Create enhanced chunks with full metadata using EXACT PAGE MAPPING
   */
  private async createEnhancedChunks(
    content: string,
    units: any[],
    metadata: {
      bookId: string;
      gradeId: string;
      subjectId: string;
      gradeTitle: string;
      subjectTitle: string;
      pageOffset?: number;
    },
  ): Promise<EnhancedChunkPayload[]> {
    const maxChars = 800;
    const allChunks: EnhancedChunkPayload[] = [];
    const pageDelim = '\f';

    // Split content into pages
    // Note: PDF pages are 1-indexed in UI but 0-indexed in array
    const rawPages = content.split(pageDelim);
    const pages = rawPages.map(p => p.trim()).filter(p => p.length > 0);
    
    this.logger.log(`📄 strict-mode: Parsed ${pages.length} pages from PDF`);

    // Helper to get exact text for a page range
    const getTextByPageRange = (start: number, end: number): string => {
      // Offset application
      const offset = (metadata as any).pageOffset || 0; // Need to pass pageOffset in metadata

      // 1-based index conversion
      const s = Math.max(1, start + offset) - 1; 
      const e = Math.min(end + offset, pages.length) - 1; // inclusive end page
      
      if (s > e || s >= pages.length) return '';
      
      // Strict slice of pages array
      return pages.slice(s, e + 1).join('\n\n');
    };

    // Recursive processor
    const processItem = (
      item: any,
      unitNumber: number,
      unitTitle: string,
      hierarchy: string[],
      hierarchyLevel: number,
    ): EnhancedChunkPayload[] => {
      const chunks: EnhancedChunkPayload[] = [];
      const start = Number(item.pageStart) || 1;
      const end = Number(item.pageEnd) || start;

      // Build contextual header
      const contextualHeader = `${metadata.gradeTitle} - ${metadata.subjectTitle} - ${hierarchy.join(' > ')} (Pages ${start}-${end})`;

      // If leaf node (no subchapters), chunk it
      if (!item.subChapters || item.subChapters.length === 0) {
        const text = getTextByPageRange(start, end);
        if (text) {
          const textChunks = this.createFixedSizeChunks(text, maxChars);
          
          textChunks.forEach((chunkText, i) => {
            const chunkId = uuidv4();
            const fullText = `${contextualHeader}\n\n${chunkText}`;
            
            // NEW: Detect figures/diagrams in the chunk text
            const figureMatch = chunkText.match(/(?:Figure|Fig\.?|Diagram|Chart|Table)\s*(\d+(?:\.\d+)?)\s*[:\.\-]?\s*(.{0,100})/i);
            const hasFigure = figureMatch !== null || 
                              /\b(diagram|chart|graph|illustration|image|picture|figure)\b/i.test(chunkText);
            const figure_number = figureMatch ? `Figure ${figureMatch[1]}` : null;
            const figure_title = figureMatch && figureMatch[2] ? figureMatch[2].trim().replace(/[.,:;]$/, '') : null;
            
            chunks.push({
              // Core identifiers
              bookId: metadata.bookId,
              gradeId: metadata.gradeId,
              subjectId: metadata.subjectId,
              gradeTitle: metadata.gradeTitle,
              subjectTitle: metadata.subjectTitle,

              // Unit info
              unitNumber,
              unitTitle,

              // Subunit info
              subunitNumber: item.subunitNumber || null,
              subUnitTitle: item.title || null,

              // Chunk identification
              chunkId,
              chunkIndex: 0, // placeholder — will be assigned globally after all chunks are created
              chunkHash: this.generateHash(chunkText),

              // Content
              text: fullText,
              contextualHeader,

              // Page info
              pageStart: start,
              pageEnd: end,

              // Linking (will be set after all chunks are created)
              prevChunkId: null,
              nextChunkId: null,

              // Image/Figure detection
              hasImage: hasFigure,
              imageDescriptions: hasFigure ? [`Contains ${figure_number || 'visual content'}`] : [],

              // Figure metadata
              figure_number,
              figure_title,
              isImageChunk: hasFigure,

              // Terms (will be extracted)
              keyTerms: this.termExtractionService.extractTermsFallback(chunkText, 8),

              // Hierarchy
              hierarchyLevel,
              hierarchyPath: hierarchy,
            });
          });
        }
      } else {
        // Has children, process them
        for (const sub of item.subChapters) {
          chunks.push(
            ...processItem(
              sub,
              unitNumber,
              unitTitle,
              [...hierarchy, sub.title],
              hierarchyLevel + 1,
            ),
          );
        }
      }

      return chunks;
    };

    // Process all units IN ORDER — Unit 1 first, then Unit 2, etc.
    const sortedUnits = [...units].sort((a, b) => {
      const numA = Number(a.unitNumber) || units.indexOf(a) + 1;
      const numB = Number(b.unitNumber) || units.indexOf(b) + 1;
      return numA - numB;
    });

    for (const unit of sortedUnits) {
      const unitNumber = Number(unit.unitNumber) || sortedUnits.indexOf(unit) + 1;
      const unitChunks = processItem(
        unit,
        unitNumber,
        unit.title,
        [unit.title],
        1,
      );
      allChunks.push(...unitChunks);
    }

    // Assign GLOBAL sequential chunkIndex across the entire book
    // Unit 1 chunks get 0,1,2...N, Unit 2 gets N+1,N+2... etc.
    for (let i = 0; i < allChunks.length; i++) {
      allChunks[i].chunkIndex = i;
    }

    // Link chunks (prev/next) using the global sequential order
    this.linkChunks(allChunks);

    this.logger.log(`📊 Sequential order: ${allChunks.length} chunks, Units: ${sortedUnits.map(u => u.title).join(' → ')}`);

    return allChunks;
  }

  /**
   * Link chunks with prev/next IDs for sliding window retrieval
   */
  /**
   * Link chunks sequentially within each unit.
   * Chunks are already in global book order (sorted by chunkIndex).
   * Prev/next links stay WITHIN the same unit to prevent cross-unit bleed.
   */
  private linkChunks(chunks: EnhancedChunkPayload[]): void {
    // Group by unit, preserving the sequential order
    const unitGroups = new Map<number, EnhancedChunkPayload[]>();

    for (const chunk of chunks) {
      if (!unitGroups.has(chunk.unitNumber)) {
        unitGroups.set(chunk.unitNumber, []);
      }
      unitGroups.get(chunk.unitNumber)!.push(chunk);
    }

    // Link within each unit (chunks are already in reading order from processItem)
    for (const [unitNum, unitChunks] of unitGroups.entries()) {
      for (let i = 0; i < unitChunks.length; i++) {
        unitChunks[i].prevChunkId = i > 0 ? unitChunks[i - 1].chunkId : null;
        unitChunks[i].nextChunkId = i < unitChunks.length - 1 ? unitChunks[i + 1].chunkId : null;
      }
      this.logger.log(`🔗 Unit ${unitNum}: ${unitChunks.length} chunks linked`);
    }
  }

  /**
   * Upload chunks to Qdrant with embeddings
   */
  private async uploadChunksToQdrant(
    collectionName: string,
    chunks: EnhancedChunkPayload[],
  ): Promise<number> {
    const batchSize = 10;
    let uploaded = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((c) => c.text.slice(0, 500)); // Truncate for embedding

      // Generate embeddings
      const embeddings = await this.generateEmbeddings(texts);

      // Create points
      const points = embeddings.map((vector, idx) => ({
        id: batch[idx].chunkId,
        vector,
        payload: batch[idx] as unknown as Record<string, unknown>,
      }));

      await this.qdrant.upsert(collectionName, { points });
      uploaded += points.length;

      this.logger.log(`📤 Uploaded batch ${Math.floor(i / batchSize) + 1} (${uploaded}/${chunks.length})`);
    }

    return uploaded;
  }

  /**
   * Generate embeddings using the centralized LLM service
   */
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.llmService.embed(text);
      embeddings.push(embedding);

      // Small delay to prevent rate limiting
      if (texts.indexOf(text) < texts.length - 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    return embeddings;
  }

  /**
   * Helper to create fixed-size text chunks
   */
  private createFixedSizeChunks(text: string, maxChars: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    if (!text || text.trim().length === 0) return [];

    while (start < text.length) {
      const end = Math.min(start + maxChars, text.length);
      chunks.push(text.slice(start, end).trim());
      start = end;
    }

    return chunks;
  }

  /**
   * Generate MD5 hash for deduplication
   */
  private generateHash(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * Get collection name from grade and subject
   */
  private getCollectionName(gradeTitle: string, subjectTitle: string): string {
    return `${gradeTitle}_${subjectTitle}`
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .toLowerCase();
  }

  /**
   * Ensure Qdrant collection exists
   */
  private async ensureQdrantCollection(collectionName: string): Promise<void> {
    const collections = await this.qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);

    if (!exists) {
      await this.qdrant.createCollection(collectionName, {
        vectors: { size: 768, distance: 'Cosine' },
      });
      this.logger.log(`🆕 Created Qdrant collection: ${collectionName}`);
    }

    // Create payload indexes for fast filtering
    const indexes: { field_name: string; field_schema: string }[] = [
      { field_name: 'unitNumber', field_schema: 'integer' },
      { field_name: 'unitTitle', field_schema: 'text' },
      { field_name: 'subUnitTitle', field_schema: 'text' },
      { field_name: 'subunitNumber', field_schema: 'keyword' },
      { field_name: 'chunkIndex', field_schema: 'integer' },
      { field_name: 'hasImage', field_schema: 'bool' },
      { field_name: 'figure_number', field_schema: 'keyword' },
    ];
    for (const idx of indexes) {
      try {
        await this.qdrant.createPayloadIndex(collectionName, idx as any);
      } catch (e) {
        // Index might already exist
      }
    }
    this.logger.log(`📇 Created ${indexes.length} payload indexes for ${collectionName}`);
  }
}
