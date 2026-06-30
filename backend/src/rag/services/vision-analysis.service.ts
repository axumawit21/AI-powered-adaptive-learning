import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../llm/llm.service';
import { ImageAnalysisResult, ExtractedImage } from '../interfaces/chunk-payload.interface';

/**
 * VisionAnalysisService
 * 
 * Uses Gemini 1.5 Pro Vision to analyze educational images from textbooks.
 * Generates searchable text descriptions that can be embedded alongside content.
 */
@Injectable()
export class VisionAnalysisService {
  private readonly logger = new Logger(VisionAnalysisService.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * Analyze an educational image and generate a searchable description.
   * @param image The extracted image with context
   * @param gradeTitle The grade level for context
   * @param subjectTitle The subject for domain-specific understanding
   */
  async analyzeImage(
    image: ExtractedImage,
    gradeTitle: string,
    subjectTitle: string,
  ): Promise<ImageAnalysisResult> {
    const prompt = `You are an expert educational content analyzer specializing in Ethiopian curriculum textbooks.

Analyze this image from a ${gradeTitle} ${subjectTitle} textbook.

Context from surrounding text:
"${image.nearbyText.slice(0, 500)}"

Provide a detailed analysis in the following JSON format:
{
  "description": "A comprehensive description of what the image shows. Include all visible elements, labels, arrows, and relationships between components.",
  "labels": ["List", "of", "key", "labels", "or", "terms", "visible", "in", "the", "image"],
  "educationalSignificance": "Why is this image important for understanding the topic? What concept does it illustrate?",
  "relatedTerms": ["Academic", "terms", "that", "students", "might", "search", "for", "to", "find", "this", "image"]
}

IMPORTANT: Return ONLY the JSON object, no additional text.`;

    try {
      // Check if LLM service supports vision
      const response = await this.llmService.generateWithVision(
        image.imageBuffer,
        prompt,
        { temperature: 0.3 },
      );

      const cleanJson = response.text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanJson) as ImageAnalysisResult;
    } catch (error) {
      this.logger.warn(
        `Vision analysis failed for image on page ${image.pageNumber}: ${error.message}`,
      );
      
      // Return fallback with nearby text context
      return {
        description: `Educational diagram from page ${image.pageNumber}. Context: ${image.nearbyText.slice(0, 200)}...`,
        labels: [],
        educationalSignificance: 'Visual aid for the topic discussed in the surrounding text.',
        relatedTerms: [],
      };
    }
  }

  /**
   * Batch analyze multiple images with rate limiting
   */
  async analyzeImages(
    images: ExtractedImage[],
    gradeTitle: string,
    subjectTitle: string,
    delayMs: number = 1000,
  ): Promise<Map<number, ImageAnalysisResult>> {
    const results = new Map<number, ImageAnalysisResult>();

    for (const image of images) {
      this.logger.log(`Analyzing image from page ${image.pageNumber}...`);
      
      const analysis = await this.analyzeImage(image, gradeTitle, subjectTitle);
      results.set(image.pageNumber, analysis);

      // Rate limit to avoid API throttling
      if (images.indexOf(image) < images.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    this.logger.log(`Completed analysis of ${results.size} images`);
    return results;
  }

  /**
   * Generate a text chunk from image analysis for embedding
   */
  generateImageChunkText(
    analysis: ImageAnalysisResult,
    pageNumber: number,
    contextualHeader: string,
  ): string {
    const parts = [
      contextualHeader,
      '',
      `📷 IMAGE CONTENT (Page ${pageNumber}):`,
      analysis.description,
      '',
      `🏷️ Key Labels: ${analysis.labels.join(', ') || 'None detected'}`,
      '',
      `📚 Educational Significance: ${analysis.educationalSignificance}`,
      '',
      `🔍 Related Search Terms: ${analysis.relatedTerms.join(', ') || 'None'}`,
    ];

    return parts.join('\n');
  }
}
