import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../llm/llm.service';

/**
 * TermExtractionService
 * 
 * Extracts academic terms from text chunks for hybrid search indexing.
 * Uses LLM to identify domain-specific vocabulary from Ethiopian curriculum.
 */
@Injectable()
export class TermExtractionService {
  private readonly logger = new Logger(TermExtractionService.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * Extract academic terms from a text chunk using LLM
   */
  async extractTerms(
    text: string,
    subjectTitle: string,
    maxTerms: number = 10,
  ): Promise<string[]> {
    const prompt = `You are an expert in Ethiopian high school curriculum for ${subjectTitle}.

Extract the most important ACADEMIC TERMS from this text chunk. These terms should be:
1. Domain-specific vocabulary (scientific terms, historical names, mathematical concepts)
2. Key concepts that students would search for
3. Ethiopian-specific terms if applicable

Text:
"${text.slice(0, 800)}"

Return ONLY a JSON array of lowercase terms, maximum ${maxTerms} terms.
Example: ["photosynthesis", "chloroplast", "glucose", "atp", "chlorophyll"]

Terms:`;

    try {
      const response = await this.llmService.generate(prompt, {
        temperature: 0.2,
      });

      const cleanJson = response.text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const terms = JSON.parse(cleanJson);
      
      if (Array.isArray(terms)) {
        return terms
          .slice(0, maxTerms)
          .map((t: any) => String(t).toLowerCase().trim())
          .filter((t: string) => t.length > 2);
      }
      
      return [];
    } catch (error) {
      this.logger.warn(`Term extraction failed: ${error.message}`);
      return this.extractTermsFallback(text, maxTerms);
    }
  }

  /**
   * Fallback: Extract terms using simple NLP heuristics
   * (No LLM needed - useful for batch processing)
   */
  extractTermsFallback(text: string, maxTerms: number = 10): string[] {
    // Simple extraction based on capitalization and length
    const words = text
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4);

    // Count word frequency
    const wordCount = new Map<string, number>();
    for (const word of words) {
      const lower = word.toLowerCase();
      wordCount.set(lower, (wordCount.get(lower) || 0) + 1);
    }

    // Sort by frequency and take top terms
    const sortedTerms = Array.from(wordCount.entries())
      .filter(([word, count]) => count >= 2 || word.length > 7)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTerms)
      .map(([word]) => word);

    return sortedTerms;
  }

  /**
   * Batch extract terms from multiple chunks
   * Uses fallback method for speed, LLM for accuracy on important chunks
   */
  async batchExtractTerms(
    chunks: { text: string; isImportant?: boolean }[],
    subjectTitle: string,
    maxTermsPerChunk: number = 10,
  ): Promise<Map<number, string[]>> {
    const results = new Map<number, string[]>();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      if (chunk.isImportant) {
        // Use LLM for important chunks (e.g., first chunk of each unit)
        const terms = await this.extractTerms(
          chunk.text,
          subjectTitle,
          maxTermsPerChunk,
        );
        results.set(i, terms);
      } else {
        // Use fast fallback for regular chunks
        const terms = this.extractTermsFallback(chunk.text, maxTermsPerChunk);
        results.set(i, terms);
      }
    }

    return results;
  }

  /**
   * Merge and deduplicate terms from multiple extractions
   */
  mergeTerms(termArrays: string[][]): string[] {
    const termSet = new Set<string>();
    
    for (const terms of termArrays) {
      for (const term of terms) {
        termSet.add(term.toLowerCase().trim());
      }
    }

    return Array.from(termSet);
  }
}
