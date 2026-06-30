import { Injectable, Logger, Inject, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT } from '../common/qdrant.provider';
import { LlmService } from '../llm/llm.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Presentation, PresentationDocument } from './schemas/presentation.schema';
import { RetrievalService } from '../rag/services/retrieval.service';

@Injectable()
export class PresentationService {
  private readonly logger = new Logger(PresentationService.name);

  constructor(
    @Inject(QDRANT) private readonly qdrant: QdrantClient,
    private readonly llmService: LlmService,
    @InjectModel(Presentation.name) private presentationModel: Model<PresentationDocument>,
    private readonly retrievalService: RetrievalService,
  ) {}

  async generatePresentation(dto: {
    gradeId?: string;
    subjectId?: string;
    unit: string;
    gradeTitle: string;
    subjectTitle: string;
  }): Promise<Presentation> {
    const { unit, gradeTitle, subjectTitle } = dto;

    // 1. Check if already exists
    const existing = await this.presentationModel.findOne({
      grade: gradeTitle,
      subject: subjectTitle,
      unit: unit,
    });

    if (existing) {
      this.logger.log(`Found existing presentation for ${unit}`);
      return existing;
    }

    this.logger.log(`Generating new presentation for ${unit} (${subjectTitle}, ${gradeTitle})`);

    // 2. Context Retrieval (RAG)
    const collectionName = this.getCollectionName(gradeTitle, subjectTitle);
    let context = "";
    let sourceCitation = "";

    try {
        const unitNumber = isNaN(Number(unit)) ? undefined : Number(unit);
        
        let retrievalResult;

        if (unitNumber !== undefined) {
             // Numeric unit identifier - filter by unitNumber metadata
             this.logger.log(`Using numeric filter for Unit ${unitNumber}`);
             retrievalResult = await this.retrievalService.retrieveForUnit(
                collectionName, 
                unitNumber
             );
        } else {
             // String-based unit identifier - filter by unitTitle metadata
             this.logger.log(`Using title filter for Unit "${unit}"`);
             retrievalResult = await this.retrievalService.retrieveForUnitTitle(
              collectionName,
              unit,
            );
        }

        const chunks = retrievalResult.chunks.map(c => c.text);
        context = chunks.join('\n\n');
        
        sourceCitation = retrievalResult.sources
          .map(s => `• ${s.unitTitle} (Pages ${s.pageRange})`)
          .join('\n');

        this.logger.log(`Found ${chunks.length} chunks of context for presentation.`);
    } catch (e) {
        this.logger.error(`Context retrieval failed for ${collectionName}: ${e.message}`);
        throw new InternalServerErrorException(`Failed to retrieve content for presentation. Please ensure the book is preprocessed.`);
    }

    // 🚫 STRICT: Fail if no context retrieved
    if (!context || context.trim().length === 0) {
      throw new NotFoundException(`No content found for unit "${unit}" in ${subjectTitle}. Cannot generate presentation without source material.`);
    }

    const prompt = `
Generate a structured, visually engaging PowerPoint presentation outline for the following:

Subject: ${subjectTitle}
Grade: ${gradeTitle}
Unit: ${unit}

📖 Context from Textbook (STRICT - Use ONLY this content):
${context.slice(0, 150000)}

📚 Available Sources:
${sourceCitation}

🚫 CRITICAL RULES:
- Generate slides ONLY from the textbook content above.
- Use VARIED layouts to make the presentation engaging (like Skywork AI style). don't just use standard bullets.
- For "Types of..." or "Classification" content -> Use 'grid' layout.
- For "X vs Y" or "Differences" content -> Use 'comparison' layout.
- For Summaries, Formulas, or Key Concepts -> Use 'dashboard' layout.

Presentation Requirements:
- Total slides: 8–12
- Tone: Educational, engaging, clear.

Slide Structure Request:
1. Title Slide (Standard)
2. Learning Objectives (Standard)
3. Key Concepts Dashboard (Dashboard Layout) produces a visual summary.
4-8. Content Slides (Mix of Grid, Comparison, and Standard layouts based on content type).
9. Examples / Applications (Standard or Grid)
10. Summary (Dashboard Layout)
11. Sources Slide

Layout Specifications:
1. 'standard': Title + bulletPoints.
2. 'dashboard': Title + content.keyConcept (left box) + content.formula (if physics/chem/math) + content.chartData (if stats exist).
3. 'grid': Title + content.gridItems array [{ title, description }]. Use for lists of 4 items.
4. 'comparison': Title + content.comparisonItems array [{ feature, left, right }]. Use for A vs B.

Output Format (STRICT JSON):
{
  "subject": "${subjectTitle}",
  "grade": "${gradeTitle}",
  "unit": "${unit}",
  "slides": [
    {
      "slideNumber": 1,
      "layout": "standard" | "dashboard" | "grid" | "comparison",
      "title": "Slide Title",
      "bulletPoints": ["point 1", "point 2"],
      "content": {
        "keyConcept": "Core definition here...",
        "formula": "E = mc^2 (optional)",
        "chartData": [{"label": "A", "value": 10}, {"label": "B", "value": 20}],
        "leftTitle": "Physical Change",
        "rightTitle": "Chemical Change",
        "comparisonItems": [
           {"feature": "Reversibility", "left": "Reversible", "right": "Irreversible"}
        ],
        "gridItems": [
           {"title": "Type A", "description": "Desc A"},
           {"title": "Type B", "description": "Desc B"}
        ]
      }
    }
  ]
}

Rules:
- RETURN ONLY THE JSON. NO MARKDOWN BLOCK.
- Ensure 'layout' matches the content type structure.
`;

    // 4. LLM Generation
    try {
        const res = await this.llmService.generate(prompt, { temperature: 0.5, format: 'json' });
        let cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);

        // 5. Save and Return
        // 5. Save and Return
        const newPresentation = new this.presentationModel({
            grade: gradeTitle,
            subject: subjectTitle,
            unit: unit,
            slides: data.slides
        });

        return await newPresentation.save();

    } catch (e) {
        this.logger.error("LLM Generation or Parsing failed", e);
        throw new InternalServerErrorException("Failed to generate presentation");
    }
  }

  async getPresentation(gradeTitle: string, subjectTitle: string, unit: string): Promise<Presentation | null> {
    // Only return APPROVED presentations to students
    return this.presentationModel.findOne({
      grade: gradeTitle,
      subject: subjectTitle,
      unit: unit,
      status: 'approved'
    });
  }

  private getCollectionName(grade: string, subject: string): string {
    return `${grade}_${subject}`
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .toLowerCase();
  }
}


