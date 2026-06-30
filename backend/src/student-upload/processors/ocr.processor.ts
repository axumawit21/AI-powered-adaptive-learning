import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../llm/llm.service';

@Injectable()
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * Extract text from an image using Gemini Vision API
   */
  async extractText(imageBuffer: Buffer, mimeType: string): Promise<string> {
    this.logger.log(`Extracting text from image (${mimeType}) using Gemini Vision`);

    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      // Use Gemini Vision for OCR
      const prompt = `
Analyze the educational content in this image.
Provide a detailed transcription of the text and descriptions of any diagrams for study purposes.

RULES:
- Transcribe visible text so the student can search it.
- Describe diagrams in [FIGURE: description] format.
- Maintain the original structure (headings, lists).
- Do NOT add external commentary.

Return ONLY the transcription.
`;

      const result = await this.llmService.generateWithImage(prompt, base64Image, mimeType);
      
      this.logger.log(`OCR extracted ${result.text.length} characters`);
      return result.text;
    } catch (error) {
      this.logger.error(`Gemini Vision OCR failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if file is an image
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }
}
