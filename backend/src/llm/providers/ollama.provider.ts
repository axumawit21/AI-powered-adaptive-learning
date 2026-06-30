import { Logger } from '@nestjs/common';
import axios from 'axios';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Ollama Provider — Self-hosted local models.
 * No rate limits, no cost, but slower and quality depends on hardware.
 * 
 * Capabilities: Text Generation ✅ | Embeddings ✅ | Vision ⚠️ (LLaVA)
 * Role: Last-resort fallback when all cloud providers fail
 */
export class OllamaProvider implements LLMProvider {
  readonly name = 'Ollama';
  private readonly logger = new Logger('OllamaProvider');
  private readonly baseUrl: string;
  private readonly textModel: string;
  private readonly embedModel = 'nomic-embed-text';

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.textModel = process.env.OLLAMA_MODEL || 'llama3.2:latest';
    this.logger.log(`✅ Ollama provider configured (${this.baseUrl}, model: ${this.textModel})`);
  }

  isAvailable(): boolean {
    // Ollama is always "available" as a config — actual availability depends on the server running
    return true;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<{ text: string }> {
    try {
      const res = await axios.post<{ response: string }>(
        `${this.baseUrl}/api/generate`,
        {
          model: this.textModel,
          prompt,
          format: options?.format,
          stream: false,
          options: { temperature: options?.temperature || 0.7 },
        },
        { timeout: 120000 }, // Ollama can be slow
      );

      this.logger.log(`✅ Ollama [${this.textModel}] generation complete`);
      return { text: res.data.response };
    } catch (e: any) {
      this.logger.error(`❌ Ollama Generate Error: ${e.message}`);
      throw e;
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const res = await axios.post<{ embedding: number[] }>(
        `${this.baseUrl}/api/embeddings`,
        { model: this.embedModel, prompt: text },
        { timeout: 60000 },
      );

      return res.data.embedding;
    } catch (e: any) {
      this.logger.error(`❌ Ollama Embed Error: ${e.message}`);
      throw e;
    }
  }
}
