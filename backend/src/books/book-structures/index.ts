import { Unit } from './book-structure.types';

/**
 * BOOK_STRUCTURES is a dictionary mapping grade -> subject -> Unit[]
 * This allows preprocessing to use predefined structures instead of TOC extraction.
 * 
 * Format:
 * {
 *   'grade10': {
 *     'biology': [
 *       { id: 'unit-1', unitNumber: 1, title: 'Cell Biology', pageStart: 1, pageEnd: 25, subChapters: [...] }
 *     ]
 *   }
 * }
 * 
 * When a book's units are managed via the admin panel, this structure is stored
 * directly in the book document's `units` field in MongoDB.
 */
export const BOOK_STRUCTURES: Record<string, Record<string, Unit[]>> = {};

export * from './book-structure.types';
