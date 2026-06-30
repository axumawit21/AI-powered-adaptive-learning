import { Injectable, Logger, Inject, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QDRANT } from '../common/qdrant.provider';
import type { QdrantClient } from '@qdrant/js-client-rest';
import { LlmService } from '../llm/llm.service';
import { Summary, SummaryDocument } from './schemas/summary.schema';
import { RetrievalService } from '../rag/services/retrieval.service';
import { getSubjectCategory, getGradeLevelInfo, TEMPLATES } from './summary.templates';

@Injectable()
export class SummarizeService {
  private readonly logger = new Logger(SummarizeService.name);

  constructor(
    @Inject(QDRANT) private readonly qdrant: QdrantClient,
    private readonly llmService: LlmService,
    @InjectModel(Summary.name) private summaryModel: Model<SummaryDocument>,
    private readonly retrievalService: RetrievalService,
  ) {}

  async generateSummary(
    gradeId: string, 
    subjectId: string, 
    unitIdentifier: string, 
    type: string, 
    gradeTitle: string, 
    subjectTitle: string
  ): Promise<Summary> {
    
    // 1. Check if summary already exists
    const existing = await this.summaryModel.findOne({
      grade: gradeTitle,
      subject: subjectTitle,
      unit: unitIdentifier
    });

    if (existing) {
      this.logger.log(`Found existing summary for ${unitIdentifier}`);
      return existing;
    }

    this.logger.log(`Generating new summary for ${unitIdentifier} (${subjectTitle}, ${gradeTitle})`);

    // 2. Context Retrieval (RAG)
    const collectionName = `${gradeTitle}_${subjectTitle}`.replace(/\s+/g, '_').replace(/[^\w_]/g, '').toLowerCase();
    
    // NEW: Get Subject Category and Grade Level Info for dynamic prompting
    const subjectCategory = getSubjectCategory(subjectTitle);
    const { tone, complexity } = getGradeLevelInfo(gradeTitle);
    
    let context = "";
    let sourceCitation = "";

    try {
        const unitNumber = isNaN(Number(unitIdentifier)) ? undefined : Number(unitIdentifier);
        
        let retrievalResult;
        
        // Use specialized retrieval based on unit identifier type
        if (unitNumber !== undefined) {
             // Numeric unit identifier - filter by unitNumber
             this.logger.log(`Using numeric filter for Unit ${unitNumber}`);
             retrievalResult = await this.retrievalService.retrieveForUnit(
                collectionName, 
                unitNumber
             );
        } else {
             // String-based unit identifier - filter by unitTitle
             this.logger.log(`Using title filter for Unit "${unitIdentifier}"`);
             retrievalResult = await this.retrievalService.retrieveForUnitTitle(
               collectionName,
               unitIdentifier,
             );
        }

        const chunks = retrievalResult.chunks.map(c => c.text);
        if (!chunks || chunks.length === 0) {
            this.logger.error(`No context found for ${unitIdentifier} in ${collectionName}`);
            throw new NotFoundException(`No content found for Unit: ${unitIdentifier}. Please ensure the material is uploaded/processed.`);
        }

        context = chunks.join('\n\n');
        
        sourceCitation = retrievalResult.sources
          .map(s => `• ${s.unitTitle} (Pages ${s.pageRange})`)
          .join('\n');

        this.logger.log(`Found ${chunks.length} chunks of context with ${retrievalResult.sources.length} source references.`);
    } catch (e) {
        if (e instanceof NotFoundException) throw e;
        this.logger.warn(`Context retrieval failed for ${collectionName}: ${e.message}`);
        throw new InternalServerErrorException("Failed to retrieve content for summary generation.");
    }

    // 3. Construct Comprehensive Educational Content Prompt

    // Get Template
    const template = TEMPLATES[subjectCategory] || TEMPLATES['GENERAL'];

    const prompt = `
You are an AI educational content generator for an Adaptive Learning System.

Your task is to ANALYZE the provided textbook/unit content and generate
HIGH-QUALITY, HUMAN-LIKE TEACHING CONTENT for ${gradeTitle} ${subjectTitle}.

TARGET AUDIENCE ANALYSIS:
- Grade Level: ${gradeTitle}
- Subject Category: ${subjectCategory}
- Tone: ${tone}
- Complexity: ${complexity}

IMPORTANT RULES:
- Generate the summary using ONLY the content chunks provided below.
- The chunks have been pre-filtered by our retrieval system to match Unit "${unitIdentifier}".
- Trust the provided content and create a comprehensive summary from it.
- Do NOT use outside knowledge. Do NOT refuse to generate.

--------------------------------------------------
INPUT:
Grade: ${gradeTitle}
Subject: ${subjectTitle}
Unit: ${unitIdentifier}
Unit Content (pre-filtered by metadata):
${context.slice(0, 200000)}

📚 Available Sources:
${sourceCitation}
--------------------------------------------------

GENERATE THE FOLLOWING SECTIONS:

### 1️⃣ SHORT SUMMARY (Quick Revision)
- 5–7 bullet points as a single string with line breaks
- Very simple language
- Focus only on main ideas

### 2️⃣ DETAILED SUMMARY (Learning Mode)
- STRICTLY FOLLOW guidelines below.
- Format using MARKDOWN (headers, bold, lists).
- USE THIS STRUCTURE:
${template}

### 3️⃣ KEY CONCEPTS
- List 5-10 key concepts/terms from the unit

### 4️⃣ TEACHER-STYLE AUDIO SCRIPT
- Friendly, spoken teaching style (not reading)
- Structure: introduction, explanation, examples, recap

### 5️⃣ AUDIO DIALOGUE VERSION (Most Important)
- Natural conversation between two teachers (Female & Male)
- Short, spoken sentences with reactions ("Right?", "Exactly!")
- Generate at least 15-20 dialogue exchanges

--------------------------------------------------
OUTPUT FORMAT (STRICT JSON - NO MARKDOWN BLOCK AROUND THE JSON):

{
  "generalSummary": "bullet points as a single string with \\n line breaks",
  "detailedSummary": "Markdown string following the requested structure...",
  "keyConcepts": ["concept1", "concept2", "concept3"],
  "teacherAudioScript": {
    "introduction": "...",
    "explanation": "...",
    "examples": "...",
    "recap": "..."
  },
  "dialogueScript": [
    { "speaker": "female", "text": "..." },
    { "speaker": "male", "text": "..." }
  ]
}
--------------------------------------------------
RETURN ONLY THE JSON. NO MARKDOWN BLOCK AROUND THE WHOLE RESPONSE.
`;


    // 4. LLM Generation
    try {
        const res = await this.llmService.generate(prompt, { temperature: 0.7, format: 'json' });
        // Clean up response if it has markdown code blocks
        let cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        this.logger.debug(`Raw LLM Response for ${unitIdentifier}: ${cleanJson.substring(0, 500)}...`); 

        // Attempt to repair truncated JSON
        let data;
        try {
            data = JSON.parse(cleanJson);
        } catch (parseError) {
            this.logger.warn('Initial JSON parse failed, attempting repair...');
            // Try to fix common issues: unclosed arrays/objects
            let repairedJson = cleanJson;
            
            // Count braces and brackets
            const openBraces = (repairedJson.match(/{/g) || []).length;
            const closeBraces = (repairedJson.match(/}/g) || []).length;
            const openBrackets = (repairedJson.match(/\[/g) || []).length;
            const closeBrackets = (repairedJson.match(/]/g) || []).length;
            
            // Add missing closing brackets/braces
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                repairedJson += ']';
            }
            for (let i = 0; i < openBraces - closeBraces; i++) {
                repairedJson += '}';
            }
            
            // Try parsing repaired JSON
            try {
                data = JSON.parse(repairedJson);
                this.logger.log('JSON repair successful');
            } catch (repairError) {
                this.logger.error('JSON repair failed, throwing original error');
                throw parseError;
            }
        }

        // 5. Save and Return
        const newSummary = new this.summaryModel({
            grade: gradeTitle,
            subject: subjectTitle,
            unit: unitIdentifier,
            subunit: data.subunit || '',
            generalSummary: Array.isArray(data.generalSummary) 
                ? data.generalSummary.join('\n') 
                : data.generalSummary,
            detailedSummary: data.detailedSummary,
            keyConcepts: data.keyConcepts || [],
            teacherAudioScript: data.teacherAudioScript || null,
            dialogueScript: data.dialogueScript || [],
            status: 'pending',
            teacherApprovalStatus: 'pending_teacher', // Require teacher approval
        });

        return await newSummary.save();

    } catch (e) {
        this.logger.error(`LLM Generation or Parsing failed: ${e.message}`, e.stack);
        if (e instanceof SyntaxError) {
             this.logger.error("JSON Parse Failure. Check earlier logs for raw response.");
        }
        throw new InternalServerErrorException(`Failed to generate summary: ${e.message}`);
    }
  }

  async getSummary(
    gradeTitle: string, 
    subjectTitle: string, 
    unitIdentifier: string,
    subunitIdentifier?: string
  ): Promise<Summary | null> {
    // Only return APPROVED summaries to students
    const query: any = {
      grade: gradeTitle,
      subject: subjectTitle,
      unit: unitIdentifier,
      status: 'approved' 
    };
    
    // If subunit is specified, look for subunit-specific summary
    if (subunitIdentifier) {
      query.subunit = subunitIdentifier;
    } else {
      // For unit-level, look for summaries without subunit or with empty subunit
      query.$or = [
        { subunit: { $exists: false } },
        { subunit: '' },
        { subunit: null }
      ];
      delete query.subunit;
    }
    
    return this.summaryModel.findOne(query);
  }

  /**
   * Generate summary for a subunit (section within a unit)
   */
  async generateSubunitSummary(
    gradeId: string,
    subjectId: string,
    unitIdentifier: string,
    subunitIdentifier: string,
    gradeTitle: string,
    subjectTitle: string,
    subunitTitle?: string
  ): Promise<Summary> {
    // Check if subunit summary already exists
    const existing = await this.summaryModel.findOne({
      grade: gradeTitle,
      subject: subjectTitle,
      unit: unitIdentifier,
      subunit: subunitIdentifier
    });

    if (existing) {
      this.logger.log(`Found existing summary for subunit ${subunitIdentifier}`);
      return existing;
    }

    this.logger.log(`Generating new summary for Subunit ${subunitIdentifier} (Unit: ${unitIdentifier}, ${subjectTitle}, ${gradeTitle})`);

    // Context Retrieval (RAG) - filter by subunit
    const collectionName = `${gradeTitle}_${subjectTitle}`.replace(/\s+/g, '_').replace(/[^\w_]/g, '').toLowerCase();
    
    const subjectCategory = getSubjectCategory(subjectTitle);
    const { tone, complexity } = getGradeLevelInfo(gradeTitle);
    
    let context = "";
    let sourceCitation = "";

    try {
      const unitNumber = isNaN(Number(unitIdentifier)) ? undefined : Number(unitIdentifier);
      
      let retrievalResult;
      
      // Use subunit-specific retrieval
      if (unitNumber !== undefined) {
        this.logger.log(`Using numeric filter for Unit ${unitNumber}, Subunit ${subunitIdentifier}`);
        retrievalResult = await this.retrievalService.retrieveForSubunit(
          collectionName,
          unitNumber,
          subunitIdentifier
        );
      } else {
        // String-based unit/subunit - filter by titles
        this.logger.log(`Using title filter for Unit "${unitIdentifier}", Subunit "${subunitTitle || subunitIdentifier}"`);
        retrievalResult = await this.retrievalService.retrieveForSubunitTitle(
          collectionName,
          unitIdentifier,
          subunitTitle || subunitIdentifier
        );
      }

      const chunks = retrievalResult.chunks.map(c => c.text);
      if (!chunks || chunks.length === 0) {
        this.logger.error(`No context found for Subunit ${subunitIdentifier} in ${collectionName}`);
        throw new NotFoundException(`No content found for Subunit: ${subunitIdentifier}. Please ensure the material is uploaded/processed.`);
      }

      context = chunks.join('\n\n');
      
      sourceCitation = retrievalResult.sources
        .map(s => `• ${s.unitTitle} (Pages ${s.pageRange})`)
        .join('\n');

      this.logger.log(`Found ${chunks.length} chunks of context for subunit with ${retrievalResult.sources.length} source references.`);
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      this.logger.warn(`Context retrieval failed for subunit ${subunitIdentifier}: ${e.message}`);
      throw new InternalServerErrorException("Failed to retrieve content for subunit summary generation.");
    }

    // Construct Subunit-Specific Prompt
    const displaySubunit = subunitTitle || subunitIdentifier;
    const template = TEMPLATES[subjectCategory] || TEMPLATES['GENERAL'];
    
    const prompt = `
You are an expert AI educational content generator for Ethiopian high school students specifically for grade ${gradeTitle} and subject ${subjectTitle} and unit ${unitIdentifier}.

Your task is to ANALYZE the provided textbook section content and generate
HIGH-QUALITY, HUMAN-LIKE TEACHING CONTENT for ${gradeTitle} ${subjectTitle}.

TARGET AUDIENCE ANALYSIS:
- Grade Level: ${gradeTitle}
- Subject Category: ${subjectCategory}
- Tone: ${tone}
- Complexity: ${complexity}

IMPORTANT RULES:
- Generate the summary using ONLY the content chunks provided below.
- The chunks have been pre-filtered to match Subunit "${displaySubunit}" within Unit "${unitIdentifier}".
- Trust the provided content and create a focused summary from it.
- Do NOT use outside knowledge. Do NOT refuse to generate.

--------------------------------------------------
INPUT:
Grade: ${gradeTitle}
Subject: ${subjectTitle}
Unit: ${unitIdentifier}
Subunit: ${displaySubunit}
Subunit Content (pre-filtered by metadata):
${context.slice(0, 150000)}

📚 Available Sources:
${sourceCitation}
--------------------------------------------------

GENERATE THE FOLLOWING SECTIONS (focused on this specific subunit):

### 1️⃣ SHORT SUMMARY (Quick Revision)
- 3-5 bullet points as a single string with line breaks
- Very simple language
- Focus only on main ideas of this subunit

### 2️⃣ DETAILED SUMMARY (Learning Mode)
- STRICTLY FOLLOW guidelines below.
- Format using MARKDOWN (headers, bold, lists).
- USE THIS STRUCTURE:
${template}

### 3️⃣ KEY CONCEPTS
- List 3-7 key concepts/terms from this subunit

### 4️⃣ TEACHER-STYLE AUDIO SCRIPT
- Friendly, spoken teaching style (not reading)
- Structure: introduction, explanation, examples, recap

### 5️⃣ AUDIO DIALOGUE VERSION
- Natural conversation between two teachers (Female & Male)
- Short, spoken sentences with reactions ("Right?", "Exactly!")
- Generate at least 10-15 dialogue exchanges

--------------------------------------------------
OUTPUT FORMAT (STRICT JSON - NO MARKDOWN BLOCK AROUND THE JSON):

{
  "generalSummary": "bullet points as a single string with \\n line breaks",
  "detailedSummary": "Markdown string following the requested structure...",
  "keyConcepts": ["concept1", "concept2", "concept3"],
  "teacherAudioScript": {
    "introduction": "...",
    "explanation": "...",
    "examples": "...",
    "recap": "..."
  },
  "dialogueScript": [
    { "speaker": "female", "text": "..." },
    { "speaker": "male", "text": "..." }
  ]
}
--------------------------------------------------
RETURN ONLY THE JSON. NO MARKDOWN BLOCK AROUND THE WHOLE RESPONSE.
`;

    // LLM Generation
    try {
      const res = await this.llmService.generate(prompt, { temperature: 0.7, format: 'json' });
      let cleanJson = res.text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      this.logger.debug(`Raw LLM Response for subunit ${subunitIdentifier}: ${cleanJson.substring(0, 500)}...`);

      // Attempt to repair truncated JSON
      let data;
      try {
        data = JSON.parse(cleanJson);
      } catch (parseError) {
        this.logger.warn('Initial JSON parse failed, attempting repair...');
        let repairedJson = cleanJson;
        
        const openBraces = (repairedJson.match(/{/g) || []).length;
        const closeBraces = (repairedJson.match(/}/g) || []).length;
        const openBrackets = (repairedJson.match(/\[/g) || []).length;
        const closeBrackets = (repairedJson.match(/]/g) || []).length;
        
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          repairedJson += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          repairedJson += '}';
        }
        
        try {
          data = JSON.parse(repairedJson);
          this.logger.log('JSON repair successful');
        } catch (repairError) {
          this.logger.error('JSON repair failed, throwing original error');
          throw parseError;
        }
      }

      // Save with subunit field
      const newSummary = new this.summaryModel({
        grade: gradeTitle,
        subject: subjectTitle,
        unit: unitIdentifier,
        subunit: subunitIdentifier,
        generalSummary: Array.isArray(data.generalSummary) 
          ? data.generalSummary.join('\n') 
          : data.generalSummary,
        detailedSummary: data.detailedSummary,
        keyConcepts: data.keyConcepts || [],
        teacherAudioScript: data.teacherAudioScript || null,
        dialogueScript: data.dialogueScript || [],
        status: 'pending',
        teacherApprovalStatus: 'pending_teacher', // Require teacher approval
      });

      return await newSummary.save();

    } catch (e) {
      this.logger.error(`LLM Generation or Parsing failed for subunit: ${e.message}`, e.stack);
      if (e instanceof SyntaxError) {
        this.logger.error("JSON Parse Failure. Check earlier logs for raw response.");
      }
      throw new InternalServerErrorException(`Failed to generate subunit summary: ${e.message}`);
    }
  }

  async updateCustomAudio(summaryId: string, audioUrl: string): Promise<Summary> {
    const summary = await this.summaryModel.findByIdAndUpdate(
      summaryId,
      { customAudioUrl: audioUrl },
      { new: true }
    );
    if (!summary) throw new NotFoundException('Summary not found');
    return summary;
  }
}
