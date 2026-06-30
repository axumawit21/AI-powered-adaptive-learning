import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, GenerateOptions } from './providers/llm-provider.interface';
import { GroqProvider } from './providers/groq.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { apiKeyContext } from './api-key-context';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Smart LLM Router Service
 * 
 * Routes AI requests through multiple providers with automatic failover:
 * 
 *   TEXT GENERATION:  Groq → OpenRouter → Gemini → Ollama
 *   EMBEDDINGS:       Gemini → Ollama
 *   VISION / OCR:     Gemini → OpenRouter
 *   DIAGRAMS:         Gemini (exclusive — Imagen 3)
 * 
 * Students never see which provider answered. If one fails, the next picks up.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger('SmartLLMRouter');

  // Individual provider instances
  private readonly groq: GroqProvider;
  private readonly openRouter: OpenRouterProvider;
  private readonly gemini: GeminiProvider;
  private readonly ollama: OllamaProvider;

  // Provider chains (ordered by priority)
  private textProviders: LLMProvider[];
  private embedProviders: LLMProvider[];
  private visionProviders: LLMProvider[];

  // Request Queue System — limits concurrent LLM requests
  private activeRequests = 0;
  private readonly maxConcurrentRequests = 10;
  private requestQueue: Array<{ resolve: () => void }> = [];

  constructor() {
    // Initialize all providers
    this.groq = new GroqProvider();
    this.openRouter = new OpenRouterProvider();
    this.gemini = new GeminiProvider();
    this.ollama = new OllamaProvider();

    // Build provider chains based on availability
    this.textProviders = this.buildChain([
      this.groq,
      this.openRouter,
      this.gemini,
      this.ollama,
    ]);

    this.embedProviders = this.buildChain([
      this.gemini,
      this.ollama,
    ]);

    this.visionProviders = this.buildChain([
      this.gemini,
      this.openRouter,
    ]);

    // Log the active configuration
    this.logProviderStatus();
  }

  /**
   * Filter providers to only those that are available (have API keys configured)
   */
  private buildChain(providers: LLMProvider[]): LLMProvider[] {
    return providers.filter(p => p.isAvailable());
  }

  /**
   * Log which providers are active at startup
   */
  private logProviderStatus() {
    this.logger.log('╔══════════════════════════════════════════════════╗');
    this.logger.log('║         🧠 Smart LLM Router — Status            ║');
    this.logger.log('╠══════════════════════════════════════════════════╣');
    this.logger.log(`║  Text Generation:  ${this.textProviders.map(p => p.name).join(' → ') || '❌ NONE'}`);
    this.logger.log(`║  Embeddings:       ${this.embedProviders.map(p => p.name).join(' → ') || '❌ NONE'}`);
    this.logger.log(`║  Vision / OCR:     ${this.visionProviders.map(p => p.name).join(' → ') || '❌ NONE'}`);
    this.logger.log(`║  Diagrams:         ${this.gemini.isAvailable() ? 'Gemini (Imagen 3)' : '❌ NONE'}`);
    this.logger.log('╠══════════════════════════════════════════════════╣');
    this.logger.log(`║  Groq:        ${this.groq.isAvailable() ? '✅ Active (llama-3.3-70b)' : '⬜ Not configured'}`);
    this.logger.log(`║  OpenRouter:  ${this.openRouter.isAvailable() ? '✅ Active (llama-3.3-70b:free)' : '⬜ Not configured'}`);
    this.logger.log(`║  Gemini:      ${this.gemini.isAvailable() ? '✅ Active (gemini-2.5-flash-lite)' : '⬜ Not configured'}`);
    this.logger.log(`║  Ollama:      ${this.ollama.isAvailable() ? '✅ Active (local fallback)' : '⬜ Not configured'}`);
    this.logger.log('╚══════════════════════════════════════════════════╝');
  }

  // ═══════════════════════════════════════════════════════════
  // REQUEST QUEUE (rate limiting)
  // ═══════════════════════════════════════════════════════════

  private async acquireRequestSlot(): Promise<void> {
    if (this.activeRequests < this.maxConcurrentRequests) {
      this.activeRequests++;
      return;
    }
    return new Promise((resolve) => {
      this.requestQueue.push({ resolve });
    });
  }

  private releaseRequestSlot(): void {
    const next = this.requestQueue.shift();
    if (next) {
      next.resolve();
    } else {
      this.activeRequests--;
    }
  }

  private async withRateLimiting<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquireRequestSlot();
    try {
      return await operation();
    } finally {
      this.releaseRequestSlot();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PROMPT OPTIMIZER
  // ═══════════════════════════════════════════════════════════

  /**
   * Prompt Optimizer — runs automatically before every LLM call.
   * Only removes duplicate content and whitespace. All unique chunks are kept intact.
   */
  private optimizePrompt(prompt: string): string {
    const originalLength = prompt.length;
    let optimized = prompt;

    // 1. Collapse multiple blank lines into single
    optimized = optimized.replace(/\n{3,}/g, '\n\n');

    // 2. Normalize heavy template-literal indentation (preserve content indentation ≤ 6 spaces)
    optimized = optimized.replace(/^[ \t]{8,}/gm, '  ');

    // 3. Deduplicate repeated paragraphs/chunks within context blocks
    const contextPatterns = [
      /Reference Material:\n([\s\S]*?)(?=\n(?:Rules|Instructions|Return|Generate|Format|Question Type|You are|$))/i,
      /Context:\n([\s\S]*?)(?=\n(?:Rules|Instructions|Return|Generate|Format|Question|You are|$))/i,
      /Content:\n([\s\S]*?)(?=\n(?:Rules|Instructions|Return|Generate|Format|Question|You are|Based on|$))/i,
    ];

    for (const pattern of contextPatterns) {
      optimized = optimized.replace(pattern, (match, contextBlock) => {
        const paragraphs = contextBlock.split(/\n\n+/).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
        const seen = new Set<string>();
        const unique: string[] = [];

        for (const para of paragraphs) {
          const fingerprint = para.substring(0, 80).toLowerCase().replace(/\s+/g, ' ');
          if (!seen.has(fingerprint)) {
            seen.add(fingerprint);
            unique.push(para);
          }
        }

        const deduped = unique.join('\n\n');
        return match.replace(contextBlock, deduped);
      });
    }

    // 4. Remove excessive whitespace at end
    optimized = optimized.trim();

    const savedChars = originalLength - optimized.length;
    if (savedChars > 100) {
      const pct = Math.round((savedChars / originalLength) * 100);
      this.logger.log(`✂️ Prompt optimized: ${originalLength} → ${optimized.length} chars (${pct}% reduction)`);
    }

    return optimized;
  }

  // ═══════════════════════════════════════════════════════════
  // SMART ROUTING — TEXT GENERATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate text using the provider chain with automatic failover.
   * Priority: Groq → OpenRouter → Gemini → Ollama
   * 
   * This is the main method called by all 17 services.
   */
  async generate(
    prompt: string,
    options?: { temperature?: number; format?: 'json' },
  ): Promise<{ text: string }> {
    const optimizedPrompt = this.optimizePrompt(prompt);

    return this.withRateLimiting(async () => {
      // Check for BYOK (per-user personal API key) — uses Gemini directly
      const store = apiKeyContext.getStore();
      if (store?.userApiKey) {
        try {
          const userGenAI = new GoogleGenerativeAI(store.userApiKey);
          const userModel = userGenAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
          const result = await userModel.generateContent(optimizedPrompt);
          const response = await result.response;
          this.logger.log('✅ Used personal API key (BYOK) for generation');
          return { text: response.text() };
        } catch (e: any) {
          this.logger.warn(`⚠️ Personal API key failed: ${e.message}. Falling back to provider chain.`);
        }
      }

      // Route through provider chain
      if (this.textProviders.length === 0) {
        throw new Error('No text generation providers configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY.');
      }

      let lastError: Error | null = null;

      for (const provider of this.textProviders) {
        try {
          const result = await provider.generate(optimizedPrompt, options);
          // ── Log which provider & model answered ──
          const modelName = this.getModelName(provider.name);
          this.logger.log(`🧠 AI RESPONSE via ${provider.name} → model: ${modelName}`);
          return result;
        } catch (error: any) {
          lastError = error;
          this.logger.warn(`⚠️ ${provider.name} failed: ${error.message}. Trying next provider...`);
          continue;
        }
      }

      throw lastError || new Error('All text generation providers exhausted');
    });
  }

  /**
   * Returns the model name for a given provider (for logging)
   */
  private getModelName(providerName: string): string {
    const models: Record<string, string> = {
      'Groq': 'llama-3.3-70b-versatile',
      'OpenRouter': 'meta-llama/llama-3.3-70b-instruct:free',
      'Gemini': 'gemini-2.5-flash-lite',
      'Ollama': process.env.OLLAMA_MODEL || 'llama3.2:latest',
    };
    return models[providerName] || 'unknown';
  }

  // ═══════════════════════════════════════════════════════════
  // SMART ROUTING — EMBEDDINGS
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate embeddings using the provider chain.
   * Priority: Gemini → Ollama
   * 
   * IMPORTANT: Embeddings must be consistent. If you switch embedding providers,
   * you must re-index all book content in Qdrant.
   */
  async embed(text: string): Promise<number[]> {
    if (this.embedProviders.length === 0) {
      throw new Error('No embedding providers configured');
    }

    let lastError: Error | null = null;

    for (const provider of this.embedProviders) {
      if (!provider.embed) continue;
      try {
        return await provider.embed(text);
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`⚠️ ${provider.name} embed failed: ${error.message}. Trying next...`);
        continue;
      }
    }

    throw lastError || new Error('All embedding providers exhausted');
  }

  // ═══════════════════════════════════════════════════════════
  // SMART ROUTING — VISION / OCR
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate content with vision (image analysis).
   * Priority: Gemini → OpenRouter
   */
  async generateWithVision(
    imageBuffer: Buffer,
    prompt: string,
    options?: { temperature?: number },
  ): Promise<{ text: string }> {
    if (this.visionProviders.length === 0) {
      throw new Error('No vision providers configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY.');
    }

    let lastError: Error | null = null;

    for (const provider of this.visionProviders) {
      if (!provider.generateWithVision) continue;
      try {
        return await provider.generateWithVision(imageBuffer, prompt, options);
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`⚠️ ${provider.name} vision failed: ${error.message}. Trying next...`);
        continue;
      }
    }

    throw lastError || new Error('All vision providers exhausted');
  }

  /**
   * Generate content with image from base64 string.
   * Priority: Gemini → OpenRouter
   */
  async generateWithImage(
    prompt: string,
    base64Image: string,
    mimeType: string,
  ): Promise<{ text: string }> {
    if (this.visionProviders.length === 0) {
      throw new Error('No vision providers configured');
    }

    let lastError: Error | null = null;

    for (const provider of this.visionProviders) {
      if (!provider.generateWithImage) continue;
      try {
        return await provider.generateWithImage(prompt, base64Image, mimeType);
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`⚠️ ${provider.name} image analysis failed: ${error.message}. Trying next...`);
        continue;
      }
    }

    throw lastError || new Error('All image analysis providers exhausted');
  }

  // ═══════════════════════════════════════════════════════════
  // GEMINI-EXCLUSIVE FEATURES
  // ═══════════════════════════════════════════════════════════

  /**
   * Generate audio (TTS) — Gemini experimental
   */
  async generateAudio(text: string): Promise<Buffer> {
    return this.gemini.generateAudio(text);
  }

  /**
   * Generate educational diagrams — Gemini exclusive (Imagen 3)
   */
  async generateEducationalDiagram(
    description: string,
    diagramType: 'biology' | 'chemistry' | 'physics' | 'math' = 'biology',
  ): Promise<{ imageBase64: string; mimeType: string }> {
    return this.gemini.generateEducationalDiagram(description, diagramType);
  }
}
