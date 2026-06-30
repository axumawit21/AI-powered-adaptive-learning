/**
 * Common interface that all LLM providers implement.
 * The Smart Router in llm.service.ts uses this to failover between providers.
 */

export interface GenerateOptions {
  temperature?: number;
  format?: 'json';
  maxTokens?: number;
}

export interface LLMProvider {
  /** Human-readable provider name for logging */
  readonly name: string;

  /** Text generation — all providers must implement this */
  generate(prompt: string, options?: GenerateOptions): Promise<{ text: string }>;

  /** Embeddings — optional, not all providers support this */
  embed?(text: string): Promise<number[]>;

  /** Vision/OCR — optional, not all providers support this */
  generateWithVision?(
    imageBuffer: Buffer,
    prompt: string,
    options?: { temperature?: number },
  ): Promise<{ text: string }>;

  /** Vision from base64 — optional */
  generateWithImage?(
    prompt: string,
    base64Image: string,
    mimeType: string,
  ): Promise<{ text: string }>;

  /** Health check — is this provider currently available/configured? */
  isAvailable(): boolean;
}
