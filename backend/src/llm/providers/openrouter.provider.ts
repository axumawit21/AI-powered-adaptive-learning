import { Logger } from '@nestjs/common';
import axios from 'axios';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * OpenRouter Provider — Unified gateway to 200+ models.
 * Free tier: 50 RPD (no credit) → 1,000 RPD (with $10 credit)
 * 
 * API: OpenAI-compatible (https://openrouter.ai/api/v1/)
 * Free models: Llama 3.3 70B, Gemma, DeepSeek, Qwen, etc.
 * 
 * Capabilities: Text Generation ✅ | Embeddings ✅ | Vision ✅
 */
export class OpenRouterProvider implements LLMProvider {
  readonly name = 'OpenRouter';
  private readonly logger = new Logger('OpenRouterProvider');
  private readonly apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  // Free-tier models (cost $0/token)
  private readonly TEXT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';
  private readonly VISION_MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free';

  // App identification for OpenRouter analytics
  private readonly APP_NAME = 'Adaptive Learning Platform';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (this.apiKey) {
      this.logger.log(`✅ OpenRouter provider initialized (model: ${this.TEXT_MODEL})`);
    }
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<{ text: string }> {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter API key not configured');
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
            model: this.TEXT_MODEL,
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
              'HTTP-Referer': 'https://adaptive-learning.app',
              'X-Title': this.APP_NAME,
            },
            timeout: 60000, // OpenRouter free models can be slower
          },
        );

        const text = response.data.choices?.[0]?.message?.content || '';
        const model = response.data.model || this.TEXT_MODEL;
        const tokens = response.data.usage;

        this.logger.log(
          `✅ OpenRouter [${model}] — ${tokens?.total_tokens || '?'} tokens`,
        );

        return { text };
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const msg = error.response?.data?.error?.message || error.message || '';

        this.logger.warn(`⚠️ OpenRouter attempt ${attempt + 1} failed: [${status}] ${msg}`);

        // Rate limit
        if (status === 429) {
          const retryAfter = error.response?.headers?.['retry-after'];
          const delay = retryAfter
            ? parseFloat(retryAfter) * 1000
            : Math.pow(2, attempt) * 3000;
          this.logger.log(`⏳ Rate limited. Waiting ${Math.round(delay / 1000)}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Server errors — retry
        if (status >= 500) {
          const delay = Math.pow(2, attempt) * 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Model busy/unavailable (sometimes 502/503 on free tier)
        if (status === 502 || status === 503) {
          const delay = Math.pow(2, attempt) * 3000;
          this.logger.log(`⏳ Model busy. Waiting ${Math.round(delay / 1000)}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    throw lastError || new Error('OpenRouter generation failed');
  }

  /**
   * Vision/OCR with OpenRouter using free vision model
   */
  async generateWithVision(
    imageBuffer: Buffer,
    prompt: string,
    options?: { temperature?: number },
  ): Promise<{ text: string }> {
    if (!this.isAvailable()) {
      throw new Error('OpenRouter API key not configured');
    }

    const base64 = imageBuffer.toString('base64');
    let mimeType = 'image/png';
    if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
      mimeType = 'image/jpeg';
    }

    const response = await axios.post<{
        choices: Array<{ message: { content: string } }>;
      }>(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
        temperature: options?.temperature ?? 0.4,
        max_tokens: 4096,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://adaptive-learning.app',
          'X-Title': this.APP_NAME,
        },
        timeout: 60000,
      },
    );

    const text = response.data.choices?.[0]?.message?.content || '';
    this.logger.log(`✅ OpenRouter Vision [${this.VISION_MODEL}] completed`);
    return { text };
  }

  /**
   * Vision from base64 string
   */
  async generateWithImage(
    prompt: string,
    base64Image: string,
    mimeType: string,
  ): Promise<{ text: string }> {
    const response = await axios.post<{
        choices: Array<{ message: { content: string } }>;
      }>(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://adaptive-learning.app',
          'X-Title': this.APP_NAME,
        },
        timeout: 60000,
      },
    );

    const text = response.data.choices?.[0]?.message?.content || '';
    this.logger.log(`✅ OpenRouter Image Analysis [${this.VISION_MODEL}] completed`);
    return { text };
  }
}
