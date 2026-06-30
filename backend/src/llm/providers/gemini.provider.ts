import { Logger } from '@nestjs/common';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Gemini Provider — Google's AI, already integrated.
 * Free tier: 15 RPM, 1,000 RPD per project
 * 
 * Capabilities: Text Generation ✅ | Embeddings ✅ | Vision ✅ | Diagrams ✅
 * Best for: Embeddings, Vision/OCR, and as text generation backup
 */
export class GeminiProvider implements LLMProvider {
  readonly name = 'Gemini';
  private readonly logger = new Logger('GeminiProvider');

  private genAI: GoogleGenerativeAI | null = null;
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;

  // Models
  private readonly TEXT_MODEL = 'gemini-2.5-flash-lite';
  private readonly VISION_MODEL = 'gemini-2.5-flash';
  private readonly EMBED_MODEL = 'gemini-embedding-001';
  private readonly EMBED_DIMENSIONS = 768; // Match existing Qdrant collection

  constructor() {
    const apiKeysEnv = process.env.GEMINI_API_KEY || '';
    this.apiKeys = apiKeysEnv
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0 && k.startsWith('AIza')); // Only accept valid Google API keys

    if (this.apiKeys.length > 0) {
      this.initializeWithCurrentKey();
      this.logger.log(
        `✅ Gemini provider initialized — ${this.apiKeys.length} key(s), model: ${this.TEXT_MODEL}`,
      );
    } else {
      this.logger.warn('⚠️ No valid Gemini API keys found (expected AIza... format)');
    }
  }

  isAvailable(): boolean {
    return this.apiKeys.length > 0 && this.genAI !== null;
  }

  private initializeWithCurrentKey() {
    const apiKey = this.apiKeys[this.currentKeyIndex];
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private rotateKey(): boolean {
    if (this.apiKeys.length <= 1) return false;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.initializeWithCurrentKey();
    this.logger.log(`🔄 Rotated to Gemini Key #${this.currentKeyIndex + 1}/${this.apiKeys.length}`);
    return true;
  }

  /**
   * Centralized retry executor with key rotation
   */
  private async executeWithRetry<T>(
    operation: (genAI: GoogleGenerativeAI) => Promise<T>,
    operationName: string,
  ): Promise<T> {
    const maxRetries = 5;
    let attempt = 0;
    let keysTriedCount = 0;

    while (attempt < maxRetries) {
      try {
        if (!this.genAI) {
          if (this.apiKeys.length > 0) {
            this.initializeWithCurrentKey();
          } else {
            throw new Error('Gemini API keys not configured');
          }
        }
        return await operation(this.genAI!);
      } catch (e: any) {
        attempt++;
        const msg = e.message || '';

        const isQuotaExceeded = msg.includes('429');
        const isNetworkError =
          msg.includes('fetch failed') ||
          msg.includes('ECONNREFUSED') ||
          msg.includes('timeout') ||
          msg.includes('ETIMEDOUT');
        const isServerError =
          msg.includes('503') || msg.includes('500') || msg.includes('Overloaded');
        const isRetryable = isQuotaExceeded || isNetworkError || isServerError;

        this.logger.warn(`${operationName} failed (Attempt ${attempt}): ${msg}`);

        // Key rotation on quota or network errors
        if ((isQuotaExceeded || isNetworkError) && keysTriedCount < this.apiKeys.length) {
          const rotated = this.rotateKey();
          if (rotated) {
            keysTriedCount++;
            attempt = 0;
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }

        // Exponential backoff for retryable errors
        if (attempt < maxRetries && isRetryable) {
          let delay = Math.pow(2, attempt) * 1000;
          const match = msg.match(/retry in (\d+(\.\d+)?)s/);
          if (match?.[1]) {
            delay = Math.max(delay, parseFloat(match[1]) * 1000 + 1000);
          }
          this.logger.log(`Waiting ${Math.round(delay / 1000)}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw e;
        }
      }
    }
    throw new Error(`${operationName} failed after maximum retries`);
  }

  // ── Text Generation ──

  async generate(prompt: string, options?: GenerateOptions): Promise<{ text: string }> {
    return this.executeWithRetry(async genAI => {
      const model = genAI.getGenerativeModel({ model: this.TEXT_MODEL });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      this.logger.log(`✅ Gemini [${this.TEXT_MODEL}] generation complete`);
      return { text: response.text() };
    }, 'Gemini Generate');
  }

  // ── Embeddings ──

  async embed(text: string): Promise<number[]> {
    return this.executeWithRetry(async () => {
      const apiKey = this.apiKeys[this.currentKeyIndex];
      const response = await axios.post<{ embedding: { values: number[] } }>(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.EMBED_MODEL}:embedContent?key=${apiKey}`,
        {
          content: { parts: [{ text }] },
          outputDimensionality: this.EMBED_DIMENSIONS,
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 },
      );
      return response.data.embedding.values;
    }, 'Gemini Embed');
  }

  // ── Vision / OCR ──

  async generateWithVision(
    imageBuffer: Buffer,
    prompt: string,
    options?: { temperature?: number },
  ): Promise<{ text: string }> {
    return this.executeWithRetry(async genAI => {
      const visionModel = genAI.getGenerativeModel({
        model: this.VISION_MODEL,
        generationConfig: { temperature: options?.temperature || 0.4 },
      });

      const imageBase64 = imageBuffer.toString('base64');
      let mimeType = 'image/png';
      if (imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8) mimeType = 'image/jpeg';
      else if (imageBuffer.toString('utf8', 0, 4) === '%PDF') mimeType = 'application/pdf';

      const result = await visionModel.generateContent([
        { inlineData: { mimeType, data: imageBase64 } },
        { text: prompt },
      ]);

      const response = await result.response;
      this.logger.log(`✅ Gemini Vision [${this.VISION_MODEL}] complete`);
      return { text: response.text() };
    }, 'Gemini Vision');
  }

  async generateWithImage(
    prompt: string,
    base64Image: string,
    mimeType: string,
  ): Promise<{ text: string }> {
    return this.executeWithRetry(async genAI => {
      const visionModel = genAI.getGenerativeModel({
        model: this.VISION_MODEL,
        generationConfig: { temperature: 0.2 },
      });

      const result = await visionModel.generateContent([
        { inlineData: { mimeType, data: base64Image } },
        { text: prompt },
      ]);

      const response = await result.response;
      this.logger.log(`✅ Gemini Image/OCR [${this.VISION_MODEL}] complete`);
      return { text: response.text() };
    }, 'Gemini Image/OCR');
  }

  // ── Diagram Generation (Gemini-exclusive) ──

  async generateEducationalDiagram(
    description: string,
    diagramType: 'biology' | 'chemistry' | 'physics' | 'math' = 'biology',
  ): Promise<{ imageBase64: string; mimeType: string }> {
    if (!this.isAvailable()) {
      throw new Error('Gemini not available for diagram generation');
    }

    const styleGuides: Record<string, string> = {
      biology: 'scientific illustration, labeled anatomical diagram, clear line art, educational textbook quality',
      chemistry: 'molecular structure diagram, ball-and-stick model, clear chemical bonds and atom labels',
      physics: 'physics technical diagram, clear force vectors with arrows, circuit symbols, motion graphs',
      math: 'mathematical graph, geometric figure with coordinate axes, clean precise lines',
    };

    const fullPrompt = `Educational diagram for Ethiopian national entrance examination.

${styleGuides[diagramType]}

REQUIREMENTS:
- Professional textbook quality illustration
- Clean black and white or minimal color palette
- All parts clearly labeled with letters (A, B, C, D, X, Y, etc.)
- High contrast suitable for printing
- No decorative elements, purely educational content

DIAGRAM TO CREATE:
${description}`;

    // Try Imagen 3 first
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const apiKey = this.apiKeys[this.currentKeyIndex];
        this.logger.log(`🎨 Generating ${diagramType} diagram with Imagen 3 (attempt ${attempt + 1})`);

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
          {
            instances: [{ prompt: fullPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: '1:1',
              personGeneration: 'dont_allow',
              safetyFilterLevel: 'block_only_high',
            },
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 60000 },
        );

        const predictions = (response.data as any)?.predictions;
        if (predictions?.[0]?.bytesBase64Encoded) {
          this.logger.log(`✅ Diagram generated with Imagen 3`);
          return { imageBase64: predictions[0].bytesBase64Encoded, mimeType: 'image/png' };
        }
        throw new Error('No image data in Imagen 3 response');
      } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        this.logger.warn(`⚠️ Imagen 3 attempt ${attempt + 1} failed: ${errorMsg}`);
        if (errorMsg?.includes('429') && this.apiKeys.length > 1) {
          this.rotateKey();
        }
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 2000));
        }
      }
    }

    // Fallback: gemini-2.0-flash-exp
    this.logger.warn('⚠️ Imagen 3 failed. Trying gemini-2.0-flash-exp fallback...');
    return this.executeWithRetry(async genAI => {
      const imageModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: { temperature: 0.4 },
      });

      const result = await imageModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ['image', 'text'] } as any,
      });

      const parts = result.response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if ((part as any).inlineData) {
          const inlineData = (part as any).inlineData;
          return { imageBase64: inlineData.data, mimeType: inlineData.mimeType || 'image/png' };
        }
      }
      throw new Error('No image data in Gemini Flash response');
    }, 'Gemini Diagram Fallback');
  }

  async generateAudio(text: string): Promise<Buffer> {
    // TTS is experimental — throw to allow caller to fallback to browser TTS
    throw new Error('Gemini TTS experimental. Fallback to Browser.');
  }
}
