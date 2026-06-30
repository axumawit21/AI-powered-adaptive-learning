import { Injectable, Logger } from '@nestjs/common';
// pdf-parse is CommonJS, use require
const pdfParse = require('pdf-parse');

@Injectable()
export class PdfProcessor {
  private readonly logger = new Logger(PdfProcessor.name);

  /**
   * Extract text from a PDF buffer
   */
  async extractText(pdfBuffer: Buffer): Promise<{ text: string; numPages: number }> {
    this.logger.log('Extracting text from PDF...');

    try {
      const data = await pdfParse(pdfBuffer);
      
      this.logger.log(`Extracted ${data.text.length} characters from ${data.numpages} pages`);
      
      return {
        text: data.text,
        numPages: data.numpages,
      };
    } catch (error) {
      this.logger.error(`PDF extraction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if file is a PDF
   */
  isPdf(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }
}
