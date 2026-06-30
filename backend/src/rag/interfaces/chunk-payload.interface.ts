/**
 * Enhanced Chunk Payload Interface
 * Defines the complete metadata schema for Qdrant storage
 */
export interface EnhancedChunkPayload {
  // Core Identifiers
  bookId: string;
  gradeId: string;
  subjectId: string;
  
  // Human-Readable Titles
  gradeTitle: string;
  subjectTitle: string;
  
  // Unit Information
  unitNumber: number;
  unitTitle: string;
  
  // Subunit Information (optional)
  subunitNumber: string | null;
  subUnitTitle: string | null;
  
  // Chunk Identification
  chunkId: string;         // UUID
  chunkIndex: number;
  chunkHash: string;       // MD5 for deduplication
  
  // Content
  text: string;
  contextualHeader: string; // "Grade 11 - Biology - Unit 3: Enzymes - Section 3.1"
  
  // Page Information
  pageStart: number;
  pageEnd: number;
  
  // NEW: Sliding Window Navigation
  prevChunkId: string | null;
  nextChunkId: string | null;
  
  // NEW: Image Integration
  hasImage: boolean;
  imageDescriptions: string[];
  
  // NEW: Hybrid Search Support
  keyTerms: string[];
  
  // NEW: Figure/Image Metadata
  figure_number: string | null;    // e.g., "Figure 3.2"  
  figure_title: string | null;     // e.g., "Cell Division Diagram"
  isImageChunk: boolean;           // true if this chunk primarily describes an image

  // NEW: Hierarchy Depth (for filtering)
  hierarchyLevel: number;  // 1 = Unit, 2 = Subunit, 3 = Section, etc.
  hierarchyPath: string[]; // ["Unit 3", "3.1 Enzymes", "3.1.1 Structure"]
}

/**
 * Image Extraction Result
 */
export interface ExtractedImage {
  pageNumber: number;
  imageBuffer: Buffer;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  nearbyText: string;
}

/**
 * Vision Analysis Result
 */
export interface ImageAnalysisResult {
  description: string;
  labels: string[];
  educationalSignificance: string;
  relatedTerms: string[];
}

/**
 * Retrieval Options for hybrid search
 */
export interface RetrievalOptions {
  collectionName: string;
  query: string;
  
  // Filtering
  unitNumber?: number;
  unitTitle?: string;  // NEW: Filter by unit title for string-based identifiers
  subunitNumber?: string;
  includeImages?: boolean;
  figureNumber?: string;  // NEW: Filter by exact figure number (e.g., "Figure 5.4")
  
  // Search Parameters
  limit?: number;
  useHybridSearch?: boolean;
  academicTerms?: string[];
  
  // Context Expansion
  useSlidingWindow?: boolean;
  windowSize?: number; // 1 = prev + current + next
}

/**
 * Search Result with expanded context
 */
export interface EnhancedSearchResult {
  chunks: EnhancedChunkPayload[];
  totalFound: number;
  windowApplied: boolean;
  sources: {
    unitTitle: string;
    pageRange: string;
  }[];
}
