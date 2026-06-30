import { Logger } from '@nestjs/common';
import axios from 'axios';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Groq Provider — Ultra-fast inference of open-source models.
 * Free tier: 30 RPM, 1,000 RPD, 6,000 TPM
 * 
 * API: OpenAI-compatible (https://api.groq.com/openai/v1/)
 * Models: Llama 3.3 70B, Gemma 2 9B, Mixtral, etc.
 * 
 * Capabilities: Text Generation ✅ | Embeddings ❌ | Vision ⚠️ (limited)
 */
export class GroqProvider implements LLMProvider {
  readonly name = 'Groq';
  private readonly logger = new Logger('GroqProvider');
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1';

  // Primary model: best quality open-source model available on Groq
  private readonly MODEL = 'llama-3.3-70b-versatile';
  // Fast fallback for simpler tasks
  private readonly FAST_MODEL = 'llama-3.1-8b-instant';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    if (this.apiKey) {
      this.logger.log(`✅ Groq provider initialized (model: ${this.MODEL})`);
    }
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<{ text: string }> {
    if (!this.isAvailable()) {
      throw new Error('Groq API key not configured');
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await axios.post<{
            choices: Array<{ message: { content: string } }>;
            model: string;
            usage: { total_tokens: number };
          }>(
          `${this.baseUrl}/chat/completions`,
          {
            model: this.MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens || 4096,
            ...(options?.format === 'json' && {
              response_format: { type: 'json_object' },
            }),
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        );

        const text = response.data.choices?.[0]?.message?.content || '';
        const model = response.data.model || this.MODEL;
        const tokens = response.data.usage;

        this.logger.log(
          `✅ Groq [${model}] — ${tokens?.total_tokens || '?'} tokens`,
        );

        return { text };
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const msg = error.response?.data?.error?.message || error.message || '';

        this.logger.warn(`⚠️ Groq attempt ${attempt + 1} failed: [${status}] ${msg}`);

        // Rate limit — respect retry-after header
        if (status === 429) {
          const retryAfter = error.response?.headers?.['retry-after'];
          const delay = retryAfter
            ? parseFloat(retryAfter) * 1000
            : Math.pow(2, attempt) * 2000;
          this.logger.log(`⏳ Rate limited. Waiting ${Math.round(delay / 1000)}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Server errors — retry with backoff
        if (status >= 500) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Client errors (400, 401, 403) — don't retry
        break;
      }
    }

    throw lastError || new Error('Groq generation failed');
  }

  // Groq does NOT support embeddings
  // embed is not implemented

  // Groq has limited vision support — not implementing for now
  // generateWithVision is not implemented
}
