import { Injectable, Logger, Inject } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT } from '../../common/qdrant.provider';
import { LlmService } from '../../llm/llm.service';
import {
  EnhancedChunkPayload,
  RetrievalOptions,
  EnhancedSearchResult,
} from '../interfaces/chunk-payload.interface';

/**
 * RetrievalService
 *
 * Advanced retrieval with:
 * - Sliding window context (prev + current + next chunks)
 * - Unit-isolated filtering
 * - Hybrid search (semantic + keyword)
 * - Image-aware retrieval
 */
@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    @Inject(QDRANT) private readonly qdrant: QdrantClient,
    private readonly llmService: LlmService,
  ) {}

  /**
   * Main retrieval method with all enhancements
   */
  async retrieve(options: RetrievalOptions): Promise<EnhancedSearchResult> {
    const {
      collectionName,
      query,
      unitNumber,
      subunitNumber,
      includeImages,
      figureNumber,  // NEW: Figure filter
      limit = 5,
      useHybridSearch = false,
      academicTerms = [],
      useSlidingWindow = true,
      windowSize = 1,
    } = options;

    this.logger.log(
      `🔍 Retrieving from ${collectionName} | Unit: ${unitNumber ?? 'all'} | Hybrid: ${useHybridSearch} | Window: ${useSlidingWindow}`,
    );

    // 1. Generate embedding for query
    const vector = await this.llmService.embed(query);

    // 2. Build filter
    const filter = this.buildFilter({
      unitNumber,
      subunitNumber,
      includeImages,
      figureNumber,  // NEW: Pass figure filter
      academicTerms: useHybridSearch ? academicTerms : [],
    });

    // 3. Execute search
    const searchResults = await this.qdrant.search(collectionName, {
      vector,
      limit,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      with_payload: true,
    });

    if (!searchResults || searchResults.length === 0) {
      this.logger.warn(`⚠️ No results found in ${collectionName}`);
      return {
        chunks: [],
        totalFound: 0,
        windowApplied: false,
        sources: [],
      };
    }

    // 4. Apply sliding window if enabled
    let finalChunks: EnhancedChunkPayload[] = searchResults.map(
      (r: any) => r.payload as EnhancedChunkPayload,
    );

    if (useSlidingWindow) {
      finalChunks = await this.applySlidingWindow(
        collectionName,
        finalChunks,
        windowSize,
      );
    }

    // 5. Extract sources for citation
    const sources = this.extractSources(finalChunks);

    return {
      chunks: finalChunks,
      totalFound: searchResults.length,
      windowApplied: useSlidingWindow,
      sources,
    };
  }

  /**
   * Build Qdrant filter based on options
   */
  private buildFilter(options: {
    unitNumber?: number;
    subunitNumber?: string;
    includeImages?: boolean;
    figureNumber?: string;  // NEW
    academicTerms?: string[];
  }): Record<string, any> {
    const mustConditions: any[] = [];
    const shouldConditions: any[] = [];

    // Unit filter
    if (options.unitNumber !== undefined) {
      mustConditions.push({
        key: 'unitNumber',
        match: { value: options.unitNumber },
      });
    }

    // Subunit filter
    if (options.subunitNumber) {
      mustConditions.push({
        key: 'subunitNumber',
        match: { value: options.subunitNumber },
      });
    }

    // Image filter
    if (options.includeImages === true) {
      mustConditions.push({
        key: 'hasImage',
        match: { value: true },
      });
    }

    // NEW: Figure number filter (exact match)
    if (options.figureNumber) {
      mustConditions.push({
        key: 'figure_number',
        match: { value: options.figureNumber },
      });
    }

    // Keyword/term filter for hybrid search
    if (options.academicTerms && options.academicTerms.length > 0) {
      for (const term of options.academicTerms) {
        shouldConditions.push({
          key: 'keyTerms',
          match: { value: term.toLowerCase() },
        });
      }
    }

    const filter: Record<string, any> = {};
    if (mustConditions.length > 0) {
      filter.must = mustConditions;
    }
    if (shouldConditions.length > 0) {
      filter.should = shouldConditions;
      filter.min_should = 1;
    }

    return filter;
  }

  /**
   * Apply sliding window to expand context
   * Fetches prev and next chunks for each result
   */
  private async applySlidingWindow(
    collectionName: string,
    chunks: EnhancedChunkPayload[],
    windowSize: number,
  ): Promise<EnhancedChunkPayload[]> {
    const expandedChunks: EnhancedChunkPayload[] = [];
    const seenIds = new Set<string>();

    for (const chunk of chunks) {
      // Collect IDs to fetch
      const idsToFetch: string[] = [];

      // Previous chunks
      if (chunk.prevChunkId && windowSize >= 1) {
        idsToFetch.push(chunk.prevChunkId);
      }

      // Next chunks
      if (chunk.nextChunkId && windowSize >= 1) {
        idsToFetch.push(chunk.nextChunkId);
      }

      // Fetch neighbors
      if (idsToFetch.length > 0) {
        try {
          const neighbors = await this.qdrant.retrieve(collectionName, {
            ids: idsToFetch,
            with_payload: true,
          });

          // Add previous chunk first (for reading order) — only if same unit/subunit scope
          for (const neighbor of neighbors) {
            const prevPayload = neighbor.payload as unknown as EnhancedChunkPayload;
            const sameScope = prevPayload.unitNumber === chunk.unitNumber &&
              String(prevPayload.subunitNumber ?? '') === String(chunk.subunitNumber ?? '');
            if (
              neighbor.id === chunk.prevChunkId &&
              !seenIds.has(String(neighbor.id)) &&
              sameScope
            ) {
              expandedChunks.push(prevPayload);
              seenIds.add(String(neighbor.id));
            }
          }

          // Add current chunk
          if (!seenIds.has(chunk.chunkId)) {
            expandedChunks.push(chunk);
            seenIds.add(chunk.chunkId);
          }

          // Add next chunk — only if same unit/subunit scope
          for (const neighbor of neighbors) {
            const nextPayload = neighbor.payload as unknown as EnhancedChunkPayload;
            const sameScope = nextPayload.unitNumber === chunk.unitNumber &&
              String(nextPayload.subunitNumber ?? '') === String(chunk.subunitNumber ?? '');
            if (
              neighbor.id === chunk.nextChunkId &&
              !seenIds.has(String(neighbor.id)) &&
              sameScope
            ) {
              expandedChunks.push(nextPayload);
              seenIds.add(String(neighbor.id));
            }
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch neighbors: ${error.message}`);
          // Still add the main chunk
          if (!seenIds.has(chunk.chunkId)) {
            expandedChunks.push(chunk);
            seenIds.add(chunk.chunkId);
          }
        }
      } else {
        // No neighbors to fetch, just add the chunk
        if (!seenIds.has(chunk.chunkId)) {
          expandedChunks.push(chunk);
          seenIds.add(chunk.chunkId);
        }
      }
    }

    this.logger.log(
      `📖 Sliding window expanded ${chunks.length} → ${expandedChunks.length} chunks`,
    );
    return expandedChunks;
  }

  /**
   * Extract source citations from chunks
   */
  public extractSources(
    chunks: EnhancedChunkPayload[],
  ): { unitTitle: string; pageRange: string }[] {
    const sources = new Map<string, string>();

    chunks.forEach(chunk => {
      // Group by Unit Title
      if (!sources.has(chunk.unitTitle)) {
        sources.set(chunk.unitTitle, `Pages ${chunk.pageStart}-${chunk.pageEnd}`);
      } else {
        // Merge page ranges simple deduplication
        const current = sources.get(chunk.unitTitle) || '';
        const newRange = `Pages ${chunk.pageStart}-${chunk.pageEnd}`;
        if (!current.includes(newRange)) {
           sources.set(chunk.unitTitle, `${current}, ${newRange}`);
        }
      }
    });

    return Array.from(sources.entries()).map(([unitTitle, pageRange]) => ({
      unitTitle,
      pageRange
    }));
  }

  /**
   * Filter out low-quality chunks (TOC, index, page references)
   * These chunks have high semantic similarity but no actual educational content
   */
  public filterLowQualityChunks(chunks: EnhancedChunkPayload[]): EnhancedChunkPayload[] {
    const TOC_PATTERNS = [
      /^(table of contents|contents|index|chapter\s*\d+\.{3,})/i,
      /^\s*\d+\s*\.{3,}\s*\d+/,  // "1 .... 5" page number patterns
      /^(unit|chapter|section)\s+\d+\s*$/i,
      /^\d+(\.\d+)*\s+[A-Z][a-z]+.*\s+\d+$/,  // "1.1 Topic Name 5" format
    ];

    const MIN_CONTENT_LENGTH = 100; // Minimum characters for meaningful content

    return chunks.filter(chunk => {
      const text = (chunk.text || '').trim();
      
      // Filter 1: Skip very short chunks (likely headers or TOC entries)
      if (text.length < MIN_CONTENT_LENGTH) {
        this.logger.debug(`Filtered short chunk (${text.length} chars): ${text.substring(0, 50)}...`);
        return false;
      }

      // Filter 2: Skip chunks that match TOC patterns
      for (const pattern of TOC_PATTERNS) {
        if (pattern.test(text)) {
          this.logger.debug(`Filtered TOC-like chunk: ${text.substring(0, 50)}...`);
          return false;
        }
      }

      // Filter 3: Skip chunks that are mostly page numbers (e.g., "Page 1 Page 2 Page 3")
      const pageNumberRatio = (text.match(/page\s*\d+/gi) || []).length / (text.split(/\s+/).length || 1);
      if (pageNumberRatio > 0.3) {
        this.logger.debug(`Filtered page-reference heavy chunk: ${text.substring(0, 50)}...`);
        return false;
      }

      return true;
    });
  }

  /**
   * Specialized retrieval for image/diagram questions
   */
  async retrieveImageChunks(
    collectionName: string,
    query: string,
    limit: number = 5,
  ): Promise<EnhancedSearchResult> {
    return this.retrieve({
      collectionName,
      query,
      includeImages: true,
      limit,
      useSlidingWindow: false, // Images usually stand alone
    });
  }

  /**
   * NEW: Retrieve chunks by exact figure number
   * Uses Qdrant filter on figure_number field for precise matching
   */
  async retrieveByFigure(
    collectionName: string,
    figureNumber: string,  // e.g., "Figure 5.4"
    query: string = '',
    limit: number = 10,
  ): Promise<EnhancedSearchResult> {
    this.logger.log(`🖼️ Retrieving by figure: ${figureNumber} from ${collectionName}`);
    
    // First, try direct filter on figure_number field
    const filter = {
      must: [
        {
          key: 'figure_number',
          match: { value: figureNumber },
        },
      ],
    };

    try {
      // Use scroll to find by filter directly (no vector search needed)
      const scrollResult = await this.qdrant.scroll(collectionName, {
        filter,
        limit,
        with_payload: true,
      });

      if (scrollResult.points && scrollResult.points.length > 0) {
        const chunks = scrollResult.points.map(
          (p: any) => p.payload as EnhancedChunkPayload,
        );
        this.logger.log(`✅ Found ${chunks.length} chunks for ${figureNumber}`);
        return {
          chunks,
          totalFound: chunks.length,
          windowApplied: false,
          sources: this.extractSources(chunks),
        };
      }
    } catch (error) {
      this.logger.warn(`Filter search failed: ${error.message}`);
    }

    // Fallback: semantic search with figure filter
    if (query) {
      this.logger.log(`🔄 Fallback to semantic search for ${figureNumber}`);
      return this.retrieve({
        collectionName,
        query: `${figureNumber} ${query}`,
        figureNumber,
        limit,
        useSlidingWindow: true,
        windowSize: 1,
      });
    }

    // No results
    return {
      chunks: [],
      totalFound: 0,
      windowApplied: false,
      sources: [],
    };
  }

  /**
   * Unit-isolated retrieval for quizzes/exams
   */
  /**
   * Unit-isolated retrieval for quizzes/exams/summaries
   * Fetches ALL chunks for a unit (limit set high to 2000)
   */
  async retrieveForUnit(
    collectionName: string,
    unitNumber: number,
    limit: number = 2000,
  ): Promise<EnhancedSearchResult> {
    this.logger.log(
      `📘 Fetching ALL chunks for Unit ${unitNumber} from ${collectionName} (limit: ${limit})`,
    );

    const scrollResult = await this.qdrant.scroll(collectionName, {
      filter: {
        must: [{ key: 'unitNumber', match: { value: unitNumber } }],
      },
      limit,
      with_payload: true,
    });

    const chunks = (scrollResult.points || []).map(
      (p: any) => p.payload as EnhancedChunkPayload,
    );
    
    // Sort chunks by chunkIndex to ensure logical flow
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    return {
      chunks,
      totalFound: chunks.length,
      windowApplied: false,
      sources: this.extractSources(chunks),
    };
  }

  /**
   * NEW: Unit-isolated retrieval by unit TITLE (for string-based identifiers)
   * Uses text match filter on unitTitle field
   */
  async retrieveForUnitTitle(
    collectionName: string,
    unitTitle: string,
    limit: number = 2000,
  ): Promise<EnhancedSearchResult> {
    this.logger.log(
      `📘 Fetching ALL chunks for Unit Title "${unitTitle}" from ${collectionName} (limit: ${limit})`,
    );

    const scrollResult = await this.qdrant.scroll(collectionName, {
      filter: {
        must: [{ 
          key: 'unitTitle', 
          match: { text: unitTitle }  // Text match for partial matching
        }],
      },
      limit,
      with_payload: true,
    });

    const chunks = (scrollResult.points || []).map(
      (p: any) => p.payload as EnhancedChunkPayload,
    );
    
    // Sort chunks by chunkIndex to ensure logical flow
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    this.logger.log(`Found ${chunks.length} chunks for unit title "${unitTitle}"`);

    return {
      chunks,
      totalFound: chunks.length,
      windowApplied: false,
      sources: this.extractSources(chunks),
    };
  }

  /**
   * Semantic search within a specific unit (by title).
   * Performs vector similarity search filtered by unitTitle.
   * Falls back to scroll-based retrieval if embedding is unavailable (e.g. Gemini not configured).
   */
  async retrieveSemanticForUnitTitle(
    collectionName: string,
    unitTitle: string,
    query: string,
    limit: number = 50,
    subject: string = 'Biology',
  ): Promise<EnhancedSearchResult> {
    this.logger.log(
      `🔍 Semantic search in Unit "${unitTitle}" for: "${query.substring(0, 60)}..."`,
    );

    let searchResults: any[] = [];
    let usedFallback = false;

    try {
      // HyDE: for short queries, embed a hypothetical answer for better semantic match
      const queryToEmbed = query.length < 60
        ? await this.generateHypotheticalAnswer(query, subject)
        : query;
      const vector = await this.llmService.embed(queryToEmbed);
      searchResults = await this.qdrant.search(collectionName, {
        vector,
        limit,
        filter: {
          must: [{ key: 'unitTitle', match: { text: unitTitle } }],
        },
        with_payload: true,
      });
    } catch (embedErr) {
      // Embedding unavailable (e.g. Gemini not configured) — fall back to scroll
      this.logger.warn(`⚠️ Embedding failed for unit "${unitTitle}": ${embedErr.message}. Using scroll fallback.`);
      usedFallback = true;
      const scrollResult = await this.qdrant.scroll(collectionName, {
        filter: { must: [{ key: 'unitTitle', match: { text: unitTitle } }] },
        limit,
        with_payload: true,
      });
      searchResults = (scrollResult?.points || scrollResult || []).map((p: any) => ({ payload: p.payload }));
    }

    if (!searchResults || searchResults.length === 0) {
      this.logger.warn(`⚠️ No results found in Unit "${unitTitle}"`);
      return { chunks: [], totalFound: 0, windowApplied: false, sources: [] };
    }

    const chunks = searchResults.map((r: any) => r.payload as EnhancedChunkPayload);

    // Sort by chunk index for logical reading order when using fallback
    if (usedFallback) chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    const expandedChunks = await this.applySlidingWindow(collectionName, chunks, 1);
    const filteredChunks = this.filterLowQualityChunks(expandedChunks);

    this.logger.log(`✅ Unit "${unitTitle}" search: ${searchResults.length} raw → ${filteredChunks.length} quality chunks${usedFallback ? ' (scroll fallback)' : ''}`);

    return {
      chunks: filteredChunks,
      totalFound: searchResults.length,
      windowApplied: !usedFallback,
      sources: this.extractSources(filteredChunks),
    };
  }

  /**
   * Semantic search within a specific subunit (by unit number + subunit string).
   * Falls back to scroll-based retrieval if embedding is unavailable.
   */
  async retrieveSemanticForSubunit(
    collectionName: string,
    unitNumber: number,
    subunitNumber: string,
    query: string,
    limit: number = 50,
    subject: string = 'Biology',
  ): Promise<EnhancedSearchResult> {
    this.logger.log(
      `🔍 Semantic search in Unit ${unitNumber}, Subunit ${subunitNumber} for: "${query.substring(0, 60)}..."`,
    );

    let rawResults: any[] = [];
    let usedFallback = false;

    try {
      // Use a larger candidate pool (200) so there are enough results after subunit filtering
      // HyDE: for short queries, embed a hypothetical answer for better semantic match
      const queryToEmbed = query.length < 60
        ? await this.generateHypotheticalAnswer(query, subject)
        : query;
      const vector = await this.llmService.embed(queryToEmbed);
      rawResults = await this.qdrant.search(collectionName, {
        vector,
        limit: Math.max(limit, 200),
        filter: { must: [{ key: 'unitNumber', match: { value: unitNumber } }] },
        with_payload: true,
      });
    } catch (embedErr) {
      // Embedding unavailable — fall back to scroll with subunit filter
      this.logger.warn(`⚠️ Embedding failed for subunit ${subunitNumber}: ${embedErr.message}. Using scroll fallback.`);
      usedFallback = true;
      const scrollResult = await this.qdrant.scroll(collectionName, {
        filter: {
          must: [
            { key: 'unitNumber', match: { value: unitNumber } },
            { key: 'subunitNumber', match: { value: subunitNumber } },
          ],
        },
        limit,
        with_payload: true,
      });
      rawResults = (scrollResult?.points || scrollResult || []).map((p: any) => ({ payload: p.payload }));
    }

    if (!rawResults || rawResults.length === 0) {
      this.logger.warn(`⚠️ No results found in Unit ${unitNumber}/${subunitNumber}`);
      return { chunks: [], totalFound: 0, windowApplied: false, sources: [] };
    }

    let chunks = rawResults.map((r: any) => r.payload as EnhancedChunkPayload);

    // When using semantic search, narrow to the matching subunit using multiple signals
    if (!usedFallback) {
      const subNum = subunitNumber.toString().toLowerCase();

      const subunitChunks = chunks.filter(chunk => {
        // Match by subunitNumber (string or numeric, exact or prefix)
        const chunkSubNum = chunk.subunitNumber?.toString().toLowerCase() || '';
        if (chunkSubNum === subNum || chunkSubNum.startsWith(subNum + '.')) return true;

        // Match by subUnitTitle — catches cases where subunitNumber stores the title
        const chunkSubTitle = (chunk.subUnitTitle || chunk['subunitTitle'] || '').toLowerCase();
        if (chunkSubTitle && chunkSubTitle.length > 3 && subNum.includes(' ')) {
          if (chunkSubTitle.includes(subNum.substring(0, 10))) return true;
        }

        return false;
      });

      if (subunitChunks.length > 0) {
        // Take top 'limit' of the subunit-filtered chunks (similarity-ordered by Qdrant)
        chunks = subunitChunks.slice(0, limit);
        this.logger.log(`🎯 Subunit filter: ${rawResults.length} unit results → ${chunks.length} subunit matches`);
      } else {
        // Subunit not found in metadata — keep top-limit unit results as best effort
        this.logger.warn(`⚠️ No subunit "${subunitNumber}" metadata match. Keeping top-${limit} unit results.`);
        chunks = chunks.slice(0, limit);
      }
    } else {
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    }

    const expandedChunks = await this.applySlidingWindow(collectionName, chunks, 1);

    // Apply quality filter only when we have enough chunks to spare
    // Never filter so aggressively that the LLM ends up with < 3 chunks
    const filteredChunks = expandedChunks.length > 5
      ? this.filterLowQualityChunks(expandedChunks)
      : expandedChunks;

    this.logger.log(`✅ Subunit ${subunitNumber}: ${rawResults.length} raw → ${filteredChunks.length} chunks${usedFallback ? ' (scroll fallback)' : ''}`);

    return {
      chunks: filteredChunks,
      totalFound: rawResults.length,
      windowApplied: !usedFallback,
      sources: this.extractSources(filteredChunks),
    };
  }

  /**
   * Semantic search within a specific unit (by unit number).
   * Falls back to scroll-based retrieval if embedding is unavailable.
   */
  async retrieveSemanticForUnit(
    collectionName: string,
    unitNumber: number,
    query: string,
    limit: number = 50,
    subject: string = 'Biology',
  ): Promise<EnhancedSearchResult> {
    this.logger.log(
      `🔍 Semantic search in Unit ${unitNumber} for: "${query.substring(0, 60)}..."`,
    );

    let searchResults: any[] = [];
    let usedFallback = false;

    try {
      // Attempt semantic (vector) search
      // HyDE: for short queries, embed a hypothetical answer for better semantic match
      const queryToEmbed = query.length < 60
        ? await this.generateHypotheticalAnswer(query, subject)
        : query;
      const vector = await this.llmService.embed(queryToEmbed);
      searchResults = await this.qdrant.search(collectionName, {
        vector,
        limit,
        filter: { must: [{ key: 'unitNumber', match: { value: unitNumber } }] },
        with_payload: true,
      });
    } catch (embedErr) {
      // Embedding unavailable — fall back to scroll filtered by unitNumber
      this.logger.warn(`⚠️ Embedding failed for Unit ${unitNumber}: ${embedErr.message}. Using scroll fallback.`);
      usedFallback = true;
      const scrollResult = await this.qdrant.scroll(collectionName, {
        filter: { must: [{ key: 'unitNumber', match: { value: unitNumber } }] },
        limit,
        with_payload: true,
      });
      searchResults = (scrollResult?.points || scrollResult || []).map((p: any) => ({ payload: p.payload }));
    }

    if (!searchResults || searchResults.length === 0) {
      this.logger.warn(`⚠️ No results found in Unit ${unitNumber}`);
      return { chunks: [], totalFound: 0, windowApplied: false, sources: [] };
    }

    let chunks = searchResults.map((r: any) => r.payload as EnhancedChunkPayload);

    // Sort by chunk index for logical reading order when using fallback
    if (usedFallback) chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    const expandedChunks = await this.applySlidingWindow(collectionName, chunks, 1);
    const filteredChunks = this.filterLowQualityChunks(expandedChunks);

    this.logger.log(`✅ Unit ${unitNumber} search: ${searchResults.length} raw → ${filteredChunks.length} quality chunks${usedFallback ? ' (scroll fallback)' : ''}`);

    return {
      chunks: filteredChunks,
      totalFound: searchResults.length,
      windowApplied: !usedFallback,
      sources: this.extractSources(filteredChunks),
    };
  }

  /**
   * Subunit-isolated retrieval for quizzes/summaries
   * Fetches ALL chunks matching unitNumber and subunitNumber (with prefix matching)
   * e.g., subunit "1.4" will match "1.4", "1.4.1", "1.4.2" etc.
   */
  async retrieveForSubunit(
    collectionName: string,
    unitNumber: number,
    subunitNumber: string,
    limit: number = 2000,
  ): Promise<EnhancedSearchResult> {
    this.logger.log(
      `📗 Fetching chunks for Unit ${unitNumber}, Subunit ${subunitNumber}+ from ${collectionName} (limit: ${limit})`,
    );

    // First, try exact match
    let scrollResult = await this.qdrant.scroll(collectionName, {
      filter: {
        must: [
          { key: 'unitNumber', match: { value: unitNumber } },
          { key: 'subunitNumber', match: { value: subunitNumber } },
        ],
      },
      limit,
      with_payload: true,
    });

    let chunks = (scrollResult.points || []).map(
      (p: any) => p.payload as EnhancedChunkPayload,
    );

    // If exact match found nothing, try prefix matching
    // Fetch all chunks for the unit, then filter by prefix
    if (chunks.length === 0) {
      this.logger.log(`No exact match for ${subunitNumber}, trying prefix match...`);
      
      const allUnitChunks = await this.qdrant.scroll(collectionName, {
        filter: {
          must: [
            { key: 'unitNumber', match: { value: unitNumber } },
          ],
        },
        limit,
        with_payload: true,
      });

      // Filter by subunit prefix (e.g., "1.4" matches "1.4", "1.4.1", "1.4.2")
      chunks = (allUnitChunks.points || [])
        .map((p: any) => p.payload as EnhancedChunkPayload)
        .filter(chunk => {
          const chunkSubunit = chunk.subunitNumber?.toString() || '';
          // Match exact OR prefix (e.g., "1.4" matches "1.4.1")
          return chunkSubunit === subunitNumber || chunkSubunit.startsWith(subunitNumber + '.');
        });
      
      this.logger.log(`Prefix match found ${chunks.length} chunks for ${subunitNumber}*`);
    }
    
    // Sort chunks by chunkIndex to ensure logical flow
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    this.logger.log(`Found ${chunks.length} chunks for subunit ${subunitNumber}`);

    return {
      chunks,
      totalFound: chunks.length,
      windowApplied: false,
      sources: this.extractSources(chunks),
    };
  }

  /**
   * Subunit-isolated retrieval by subunit TITLE
   * Uses text match filter on subUnitTitle field
   */
  async retrieveForSubunitTitle(
    collectionName: string,
    unitTitle: string,
    subunitTitle: string,
    limit: number = 2000,
  ): Promise<EnhancedSearchResult> {
    // Trim whitespace — stored titles may have leading/trailing spaces
    const cleanUnitTitle = unitTitle.trim();
    const cleanSubTitle = subunitTitle.trim();

    this.logger.log(
      `📗 Fetching ALL chunks for Unit "${cleanUnitTitle}", Subunit "${cleanSubTitle}" from ${collectionName} (limit: ${limit})`,
    );

    // Try exact match first
    let scrollResult = await this.qdrant.scroll(collectionName, {
      filter: {
        must: [
          { key: 'unitTitle', match: { value: cleanUnitTitle } },
          { key: 'subUnitTitle', match: { value: cleanSubTitle } },
        ],
      },
      limit,
      with_payload: true,
    });

    let chunks = (scrollResult.points || []).map(
      (p: any) => p.payload as EnhancedChunkPayload,
    );

    // If exact match found nothing, try text (keyword) match as fallback
    if (chunks.length === 0) {
      this.logger.warn(`⚠️ Exact match failed for "${cleanSubTitle}", trying keyword match...`);
      scrollResult = await this.qdrant.scroll(collectionName, {
        filter: {
          must: [
            { key: 'unitTitle', match: { text: cleanUnitTitle } },
            { key: 'subUnitTitle', match: { text: cleanSubTitle } },
          ],
        },
        limit,
        with_payload: true,
      });
      chunks = (scrollResult.points || []).map(
        (p: any) => p.payload as EnhancedChunkPayload,
      );
    }

    // If still nothing, try matching only by subUnitTitle (unit title might be stored differently)
    // Post-filter by unitTitle to avoid cross-unit contamination
    if (chunks.length === 0) {
      this.logger.warn(`⚠️ No match with unitTitle filter. Trying subUnitTitle only (with post-filter)...`);
      scrollResult = await this.qdrant.scroll(collectionName, {
        filter: {
          must: [
            { key: 'subUnitTitle', match: { text: cleanSubTitle } },
          ],
        },
        limit: 100,
        with_payload: true,
      });
      const allMatches = (scrollResult.points || []).map(
        (p: any) => p.payload as EnhancedChunkPayload,
      );
      // Prefer chunks whose unitTitle matches the requested one to prevent cross-unit bleed
      const unitFiltered = allMatches.filter(c =>
        c.unitTitle && cleanUnitTitle &&
        c.unitTitle.toLowerCase().includes(cleanUnitTitle.toLowerCase().substring(0, 20))
      );
      chunks = unitFiltered.length > 0 ? unitFiltered : allMatches;
      if (unitFiltered.length === 0 && allMatches.length > 0) {
        this.logger.warn(`⚠️ subUnitTitle "${cleanSubTitle}" found across multiple units — cross-unit contamination possible`);
      }
    }

    // Sort by chunkIndex for logical reading order
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    // For chat use: keep all chunks (even short ones) — quality filter is too aggressive
    // The LLM prompt instructs it to find the relevant info within what's provided
    // Only filter out obvious TOC/page-number-only chunks
    const filteredChunks = chunks.filter(c => {
      const text = (c.text || '').trim();
      if (text.length < 30) return false; // Absolute minimum — skip empty/stub chunks
      if (/^\s*\d+\s*$/.test(text)) return false; // Pure page numbers
      return true;
    });

    this.logger.log(`✅ Found ${chunks.length} raw → ${filteredChunks.length} usable chunks for subunit "${cleanSubTitle}"`);

    return {
      chunks: filteredChunks,
      totalFound: chunks.length,
      windowApplied: false,
      sources: this.extractSources(filteredChunks),
    };
  }

  /**
   * Get collection name from grade and subject
   */
  getCollectionName(gradeTitle: string, subjectTitle: string): string {
    return `${gradeTitle}_${subjectTitle}`
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .toLowerCase();
  }

  /** ---------------------------------------------------------
   * 🔬 ADVANCED ACCURACY PIPELINE IMPLEMENTATION
   * --------------------------------------------------------- */

  /**
   * 1. HyDE (Hypothetical Document Embeddings)
   * Generates a "perfect" hypothetical textbook answer to search for.
   */
  async generateHypotheticalAnswer(query: string, subject: string): Promise<string> {
    const prompt = `
    You are an expert ${subject} tutor.
    User Question: "${query}"
    
    Write a hypothetical, perfect textbook paragraph that answers this question.
    - Be technical and precise.
    - Use academic terminology.
    - Do NOT include "The answer is" or intros. Just the content.
    - If the question is vague, infer the most likely educational topic.
    `;

    try {
      const response = await this.llmService.generate(prompt);
      const hypothetical = response.text.trim();
      this.logger.log(`👻 HyDE Generated: "${hypothetical.substring(0, 100)}..."`);
      return hypothetical;
    } catch (e) {
      this.logger.warn(`HyDE generation failed: ${e.message}`);
      return query; // Fallback to original query
    }
  }

  /**
   * 2. Adaptive Reranking (Threshold-Based)
   * Scores chunks by relevance and keeps ALL high-quality matches.
   * Now includes a "Minimum Chunk Guarantee" to prevent empty results.
   */
  async rerankChunks(
    query: string,
    chunks: EnhancedChunkPayload[],
    threshold: number = 0.5, // Lowered from 0.7 for better recall
    minChunks: number = 5    // Always keep at least top 5
  ): Promise<EnhancedChunkPayload[]> {
    if (chunks.length === 0) return [];

    this.logger.log(`⚖️ Reranking ${chunks.length} chunks (Threshold: ${threshold}, Min: ${minChunks})...`);

    // We process in batches to avoid context limits
    const results: EnhancedChunkPayload[] = [];
    const batchSize = 5;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      const prompt = `
      Rate the relevance of the following text chunks to the user's question.
      Question: "${query}"

      Chunks to Rate:
      ${batch.map((c, idx) => `[${idx}] ${c.text.substring(0, 300)}...`).join('\n')}

      Return a JSON array of objects: [{ "index": number, "score": number }]
      Score from 0.0 (irrelevant) to 1.0 (perfect answer).
      JSON ONLY.
      `;

      try {
        const res = await this.llmService.generate(prompt, { format: 'json', temperature: 0.1 });
        const scores = JSON.parse(res.text.replace(/```json|```/g, '').trim());
        
        if (Array.isArray(scores)) {
          scores.forEach((s: any) => {
             const chunkIndex = s.index;
             const score = typeof s.score === 'number' ? s.score : 0;
             if (batch[chunkIndex]) {
               const chunk = batch[chunkIndex];
               (chunk as any).relevanceScore = score;
               results.push(chunk);
             }
          });
        } else {
           // Fallback: If LLM returns bad JSON, keep chunks with default low score
           batch.forEach(c => { (c as any).relevanceScore = 0.1; results.push(c); });
        }
      } catch (e) {
        this.logger.warn(`Reranking batch failed: ${e.message}. Keeping batch as fallback.`);
        batch.forEach(c => { (c as any).relevanceScore = 0.1; results.push(c); });
        // results.push(...batch); 
      }
    }

    // Sort by score descending
    results.sort((a, b) => ((b as any).relevanceScore || 0) - ((a as any).relevanceScore || 0));

    // Filter logic: Keep if Score >= Threshold OR if it's in the Top N (Minimum Guarantee)
    const finalChunks = results.filter((chunk, index) => {
      const score = (chunk as any).relevanceScore || 0;
      return score >= threshold || index < minChunks;
    });

    this.logger.log(`🎯 Reranking kept ${finalChunks.length}/${chunks.length} chunks (Best Score: ${(results[0] as any)?.relevanceScore}).`);
    return finalChunks;
  }

  /**
   * 🚀 ADVANCED RETRIEVE
   * Replaces the standard retrieve with the full pipeline:
   * HyDE -> Vector Search (High Recall) -> Rerank (Precision) -> Sliding Window
   */
  async retrieveAdvanced(options: RetrievalOptions & { subject?: string }): Promise<EnhancedSearchResult> {
    const {
      collectionName,
      query,
      subject = 'General',
      unitNumber,
      limit = 100, // Increased from 30 to 100 for broader recall
    } = options;

    this.logger.log(`🚀 Starting Advanced Retrieval for: "${query}"`);

    // Step 1: HyDE (Optional but recommended for short queries)
    let searchVector: number[];
    if (query.length < 50 && !options.figureNumber) {
      const hypothetical = await this.generateHypotheticalAnswer(query, subject);
      searchVector = await this.llmService.embed(hypothetical);
    } else {
      searchVector = await this.llmService.embed(query);
    }

    // Step 2: High Recall Vector Search
    const filter = this.buildFilter(options);
    const searchResults = await this.qdrant.search(collectionName, {
      vector: searchVector,
      limit: limit, 
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      with_payload: true,
    });

    if (!searchResults || searchResults.length === 0) {
      return { chunks: [], totalFound: 0, windowApplied: false, sources: [] };
    }

    let initialChunks = searchResults.map(r => r.payload as unknown as EnhancedChunkPayload);

    // Step 3: Adaptive Reranking
    // Use lower threshold (0.5) and ensure at least 5 chunks
    const relevantChunks = await this.rerankChunks(query, initialChunks, 0.5, 5);

    // Step 4: Sliding Window (Context Expansion)
    // Only expand the chunks that SURVIVED reranking
    const finalChunks = await this.applySlidingWindow(collectionName, relevantChunks, 1);

    return {
      chunks: finalChunks,
      totalFound: initialChunks.length,
      windowApplied: true,
      sources: this.extractSources(finalChunks)
    };
  }
}
