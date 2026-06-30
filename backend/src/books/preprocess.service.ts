import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book } from './book.schema';
import * as fs from 'fs';
import * as path from 'path';
import { QdrantClient } from '@qdrant/js-client-rest';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';

interface ChapterPayload {
  bookId: string;
  unit: string;
  subunit: string;
  subchunk_index: number;
  text: string;
}

@Injectable()
export class PreprocessService {
  private readonly logger = new Logger(PreprocessService.name);
  private qdrant: QdrantClient;

  constructor(
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    private readonly llmService: LlmService
  ) {
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
  }

  /** Main preprocessing entry */
  async preprocessBook(bookId: string) {
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
    const pageDelim = '\f'; // Form feed delimiter
    
    if (fullPath.endsWith('.pdf')) {
      const buffer = fs.readFileSync(fullPath);
      // Custom render to preserve page breaks
      const options = {
        pagerender: async (pageData: any) => {
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
          return text + pageDelim;
        }
      } as any;

      const data = await pdfParse(buffer, options);
      content = data.text;
    } else {
      content = fs.readFileSync(fullPath, 'utf-8');
    }

    this.logger.log(`📄 Book content length: ${content.length}`);

    // 3. Validate Structure (Must exist in DB)
    if (!book.units || !Array.isArray(book.units) || book.units.length === 0) {
      throw new Error(
        `❌ No book structure found for "${book.title}". Please define units in the Admin Portal first.`
      );
    }

    this.logger.log(
      `📚 Using database structure for "${book.title}" with ${book.units.length} root units.`
    );

    // 4. Chunking Strategy
    const pageOffset = (book as any).pageOffset || 0;
    const unitChunks = this.subchunkUnitsByStructure(content, book.units, pageOffset);

    // 5. Collection Naming (Grade Title + Subject Title)
    // Safe access to titles assuming population worked
    const gradeTitle = (book.grade as any).title || 'UnknownGrade';
    const subjectTitle = (book.subject as any).title || 'UnknownSubject';

    const collectionName = `${gradeTitle}_${subjectTitle}`
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .toLowerCase();

    await this.ensureQdrantCollection(collectionName);

    // 5.5 Cleanup Existing Vectors (if updating)
    // We delete all points belonging to this bookId to ensure a clean slate
    try {
      this.logger.log(`🧹 Cleaning up old vectors for book ${bookId} in ${collectionName}...`);
      await this.qdrant.delete(collectionName, {
        filter: {
          must: [
            {
              key: 'bookId',
              match: {
                value: bookId
              }
            }
          ]
        }
      });
      // Small pause to ensure deletion propagates (Qdrant is usually fast but safety first)
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      this.logger.warn(`⚠️ Failed to cleanup old vectors (might be first run): ${e.message}`);
    }

    let totalPoints = 0;

    // 6. Upload to Qdrant
    for (const unit of unitChunks) {
      const texts = unit.chunks.map((c) => c.text);
      if (texts.length === 0) continue;

      const embeddings = await this.generateEmbeddings(texts);

      const points = embeddings.map((vector, idx) => {
        const chunk = unit.chunks[idx];
        return {
          id: uuidv4(),
          vector,
          payload: {
            bookId: (book as any)._id.toString(),
            gradeId: (book.grade as any)._id.toString(),
            subjectId: (book.subject as any)._id.toString(),
            gradeTitle: gradeTitle,
            subjectTitle: subjectTitle,
            
            // Unit Info
            unitNumber: unit.unitNumber,
            unitTitle: unit.title,
            
            // Subunit Info (if applicable)
            subunitNumber: chunk.subunitNumber || null,
            subUnitTitle: chunk.subUnitTitle || null,
            
            // Chunk Info
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
            pageStart: chunk.pageStart,
            pageEnd: chunk.pageEnd,
            
            // Figure/Image detection
            hasImage: chunk.hasImage || false,
            figure_number: chunk.figure_number || null,
            figure_title: chunk.figure_title || null,
            isImageChunk: chunk.isImageChunk || false,
            imageDescriptions: chunk.imageDescriptions || [],
          } as Record<string, unknown>,
        };
      });

      await this.qdrant.upsert(collectionName, { points });
      totalPoints += points.length;

      this.logger.log(
        `✅ Stored ${points.length} chunks for Unit ${unit.unitNumber}: ${unit.title}`
      );
    }

    this.logger.log(
      `🎉 Finished preprocessing "${book.title}" (${totalPoints} total chunks)`
    );

    // Mark book as preprocessed
    book.isPreprocessed = true;
    await book.save();

    return { message: 'Preprocessing completed successfully', totalPoints };
  }

  /** 
   * Recursively process units and subunits to create chunks.
   * Now handles deep nesting and accurate page ranges.
   */
  private subchunkUnitsByStructure(content: string, units: any[], pageOffset: number = 0) {
    const maxChars = 800; // Increased chunk size slightly
    const unitChunks: {
      unitNumber: number;
      title: string;
      chunks: {
        text: string;
        subUnitTitle: string | null;
        subunitNumber: string | null;
        pageStart: number;
        pageEnd: number;
        chunkIndex: number;
        // Figure metadata
        hasImage: boolean;
        figure_number: string | null;
        figure_title: string | null;
        isImageChunk: boolean;
        imageDescriptions: string[];
      }[];
    }[] = [];

    // Split content into pages via delimiter
    const pageDelim = '\f';
    const rawPages = content.split(pageDelim);
    // Note: PDF parsing might add extra empty pages or delimiters
    const pages = rawPages.map(p => p.trim()).filter(p => p.length > 0);

    const getTextByPageRange = (start: number, end: number): string => {
       // Offset application: 
       // User says "Page 1", offset is 4 -> we want PDF Page 5.
       // PDF Page 5 is index 4.
       // Formula: (UserPage + Offset) - 1
       
       const s = Math.max(1, start + pageOffset) - 1; 
 
       const e = Math.min(end + pageOffset, pages.length) - 1; // inclusive end page
       
       if (s > e || s >= pages.length) return '';
       
       return pages.slice(s, e + 1).join('\n\n');
    };

    // Recursive processor
    const processItem = (
      item: any, 
      parentTitle: string, 
      hierarchy: string[] // ["Unit 1", "1.1 Intro"]
    ): any[] => {
      const chunks: any[] = [];
      const start = Number(item.pageStart) || 1;
      const end = Number(item.pageEnd) || start;

      // If this item has no subchapters, it's a leaf node -> chunk it
      if (!item.subChapters || item.subChapters.length === 0) {
        const text = getTextByPageRange(start, end);
        if (text) {
          const textChunks = this.createFixedSizeChunks(text, maxChars);
          textChunks.forEach((chunkText, i) => {
            // NEW: Detect figures/diagrams in the chunk text
            const figureMatch = chunkText.match(/(?:Figure|Fig\.?|Diagram|Chart|Table)\s*(\d+(?:\.\d+)?)\s*[:\.\-]?\s*(.{0,100})/i);
            const hasFigure = figureMatch !== null || 
                              /\b(diagram|chart|graph|illustration|image|picture|figure)\b/i.test(chunkText);
            const figure_number = figureMatch ? `Figure ${figureMatch[1]}` : null;
            const figure_title = figureMatch && figureMatch[2] ? figureMatch[2].trim().replace(/[.,:;]$/, '') : null;
            
            chunks.push({
              text: `${hierarchy.join(' > ')}\n\n${chunkText}`,
              subUnitTitle: item.title,
              subunitNumber: item.subunitNumber || null,
              pageStart: start,
              pageEnd: end,
              chunkIndex: i + 1,
              // Figure metadata
              hasImage: hasFigure,
              figure_number,
              figure_title,
              isImageChunk: hasFigure,
              imageDescriptions: hasFigure ? [`Contains ${figure_number || 'visual content'}`] : [],
            });
          });
        }
      } else {
        // It has children, process them
        for (const sub of item.subChapters) {
          chunks.push(...processItem(sub, item.title, [...hierarchy, sub.title]));
        }
      }
      return chunks;
    };

    for (const unit of units) {
      const unitNumber = Number(unit.unitNumber) || units.indexOf(unit) + 1;
      // Process the unit (and its children)
      // We treat the Unit itself as the root of the hierarchy
      const chunks = processItem(unit, unit.title, [unit.title]);
      
      unitChunks.push({
        unitNumber,
        title: unit.title,
        chunks,
      });
    }

    return unitChunks;
  }

  /** Helper to create smaller fixed-size text chunks */
  private createFixedSizeChunks(text: string, maxChars: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    // guard empty
    if (!text || text.trim().length === 0) return [];

    while (start < text.length) {
      const end = Math.min(start + maxChars, text.length);
      chunks.push(text.slice(start, end).trim());
      start = end;
    }

    return chunks;
  }

  /** Generate embeddings using centralized LlmService */
  private async generateEmbeddings(texts: string[]) {
    const embeddings: number[][] = [];
    
    // Process sequentially
    for (const text of texts) {
      try {
        // Enforce basic truncation if needed (Gemini has 2048 token limit ~8k chars, 
        // ensuring we stay well within safety limits of 6000 chars)
        const safeText = text.slice(0, 6000);
        
        const embedding = await this.llmService.embed(safeText);
        embeddings.push(embedding);
        
        // Small delay to be nice to rate limits
        await new Promise(r => setTimeout(r, 100)); 
      } catch (e) {
        this.logger.error(`Embedding generation failed: ${e.message}`);
        // Push zero vector or throw? throwing ensures data integrity
        throw e;
      }
    }

    return embeddings;
  }


  /** Ensure Qdrant collection exists */
  private async ensureQdrantCollection(collectionName: string) {
    const collections = await this.qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);

    if (!exists) {
      await this.qdrant.createCollection(collectionName, {
        vectors: { size: 768, distance: 'Cosine' },
      });
      this.logger.log(`🆕 Created Qdrant collection: ${collectionName}`);
    }
  }
}