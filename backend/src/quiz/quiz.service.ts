import { Injectable, Logger, InternalServerErrorException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QdrantClient } from '@qdrant/js-client-rest';
// import fetch from 'node-fetch'; // Removed unused import
import { QDRANT } from '../common/qdrant.provider';
import { Quiz } from './quiz.schema';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import dotenv from 'dotenv';
dotenv.config();

import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../rag/services/retrieval.service';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    @InjectModel(Quiz.name) private readonly quizModel: Model<Quiz>,
    @InjectModel(Grade.name) private readonly gradeModel: Model<Grade>,
    @InjectModel(Subject.name) private readonly subjectModel: Model<Subject>,
    @Inject(QDRANT) private readonly qdrant: QdrantClient,
    private readonly llmService: LlmService,
    private readonly retrievalService: RetrievalService,
  ) {}

  async getQuizById(id: string): Promise<Quiz> {
    const quiz = await this.quizModel.findById(id).exec();
    if (!quiz) throw new InternalServerErrorException(`Quiz not found: ${id}`);
    return quiz;
  }

  private getCollectionName(grade: string, subject: string): string {
    return `${grade}_${subject}`
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '')
      .toLowerCase();
  }

  /**
   * Parse custom quiz specifications from text input
   * Examples:
   * - "10 questions" → { count: 10, types: ['mcq'] }
   * - "5 true/false" → { count: 5, types: ['true-false'] }
   * - "mix of MCQ and fill-in-the-blank" → { count: 5, types: ['mcq', 'fill-blank'] }
   */
  private parseQuizSpecification(text: string, defaultCount?: number): { count: number; types: string[] } {
    const lowerText = text.toLowerCase();
    
    // Extract question count
    const countMatch = lowerText.match(/(\d+)\s*questions?/);
    const count = countMatch ? parseInt(countMatch[1]) : (defaultCount || 5);
    
    // Extract question types
    const types: string[] = [];
    
    // Check for specific types
    const hasTrueFalse = lowerText.includes('true') && lowerText.includes('false') || lowerText.includes('true/false');
    const hasMCQ = lowerText.includes('mcq') || lowerText.includes('multiple') || lowerText.includes('choice');
    const hasFillBlank = lowerText.includes('fill') && lowerText.includes('blank') || lowerText.includes('fill-in');
    const hasShortAnswer = lowerText.includes('short') && lowerText.includes('answer');
    const hasMatching = lowerText.includes('match');
    const hasMixed = lowerText.includes('mix');
    
    // If "mixed" is mentioned, include all types
    if (hasMixed) {
      types.push('mcq', 'true-false', 'fill-blank', 'short-answer');
    } else {
      // Add only the types that are mentioned
      if (hasTrueFalse) types.push('true-false');
      if (hasMCQ) types.push('mcq');
      if (hasFillBlank) types.push('fill-blank');
      if (hasShortAnswer) types.push('short-answer');
      if (hasMatching) types.push('matching');
    }
    
    // Default to MCQ if no types specified
    if (types.length === 0) {
      types.push('mcq');
    }
    
    this.logger.log(`Parsed quiz spec: ${count} questions, types: ${types.join(', ')}`);
    
    return { count, types };
  }

  async generateQuiz(dto: { 
    gradeId: string; 
    subjectId: string; 
    unit: string; 
    subunit?: string; // NEW: optional subunit for subunit-level quiz
    subunitTitle?: string; // NEW: optional subunit title
    num_questions?: number; 
    gradeTitle?: string; 
    subjectTitle?: string;
    customSpecification?: string; // e.g., "10 questions, mix of true/false and MCQ"
  }) {
    const { gradeId, subjectId, unit, subunit, subunitTitle, gradeTitle, subjectTitle, customSpecification } = dto;
    
    // Parse custom specification or use defaults
    const spec = customSpecification 
      ? this.parseQuizSpecification(customSpecification, dto.num_questions)
      : { count: dto.num_questions || 5, types: ['mcq'] };
    
    const num_questions = spec.count;
    const questionTypes = spec.types;
    
    this.logger.log(`Quiz spec: ${num_questions} questions, types: ${questionTypes.join(', ')}${subunit ? `, subunit: ${subunit}` : ''}`);

    // 1. Resolve Grade and Subject IDs/Titles
    let gTitle = gradeTitle;
    let sTitle = subjectTitle;
    let finalGradeId: string | null = null;
    let finalSubjectId: string | null = null;

    // Helper to check if string is valid Mongo ObjectID
    const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

    // Resolve Grade
    if (isValidObjectId(gradeId)) {
        const g = await this.gradeModel.findById(gradeId);
        if (g) { finalGradeId = g._id.toString(); gTitle = g.title; }
    }
    if (!finalGradeId && gradeTitle) {
        // Try finding by title
        const g = await this.gradeModel.findOne({ title: new RegExp(gradeTitle, 'i') });
        if (g) { finalGradeId = g._id.toString(); gTitle = g.title; }
        else { gTitle = gradeTitle; }
    } else if (!finalGradeId && !isValidObjectId(gradeId)) {
         // handle case where gradeId might be a title passed in ID field
         const g = await this.gradeModel.findOne({ title: new RegExp(gradeId, 'i') });
         if (g) { finalGradeId = g._id.toString(); gTitle = g.title; }
         else { gTitle = gradeId; }
    }

    // Resolve Subject
    if (isValidObjectId(subjectId)) {
        const s = await this.subjectModel.findById(subjectId);
        if (s) { finalSubjectId = s._id.toString(); sTitle = s.title; }
    }
    if (!finalSubjectId && subjectTitle) {
        const s = await this.subjectModel.findOne({ title: new RegExp(subjectTitle, 'i') });
        if (s) { finalSubjectId = s._id.toString(); sTitle = s.title; }
        else { sTitle = subjectTitle; }
    } else if (!finalSubjectId && !isValidObjectId(subjectId)) {
         const s = await this.subjectModel.findOne({ title: new RegExp(subjectId, 'i') });
         if (s) { finalSubjectId = s._id.toString(); sTitle = s.title; }
         else { sTitle = subjectId; }
    }

    if (!gTitle || !sTitle) {
      this.logger.error(`Invalid Grade or Subject ID/Title. GradeId: ${gradeId}, SubjectId: ${subjectId}`);
      throw new InternalServerErrorException('Invalid Grade or Subject ID, and no titles provided.');
    }

    const collectionName = this.getCollectionName(gTitle, sTitle);
    const logTarget = subunit ? `unit="${unit}" subunit="${subunit}"` : `unit="${unit}"`;
    this.logger.log(
      `Generating quiz for collection=${collectionName} ${logTarget} num_questions=${num_questions}`,
    );
    const collections = await this.qdrant.getCollections();
    const allNames = collections?.collections?.map((c: any) => c.name) || [];

    if (!allNames.includes(collectionName)) {
      throw new InternalServerErrorException(
        `Qdrant collection "${collectionName}" not found. Please preprocess the book first.`,
      );
    }

    // 3. Fetch Context using Enhanced Retrieval
    let chunks: string[] = [];
    let sourceDetails: { unitTitle: string; pageRange: string }[] = [];

    try {
      // Check if unit is a number for strict isolation
      const unitNumber = isNaN(Number(unit)) ? undefined : Number(unit);
      
      let retrievalResult;
      
      // NEW: Route to subunit retrieval if subunit is provided
      if (subunit) {
        if (unitNumber !== undefined) {
          this.logger.log(`📗 Using numeric filter for Quiz Unit ${unitNumber}, Subunit ${subunit}`);
          retrievalResult = await this.retrievalService.retrieveForSubunit(
            collectionName,
            unitNumber,
            subunit
          );
        } else {
          this.logger.log(`📗 Using title filter for Quiz Unit "${unit}", Subunit "${subunitTitle || subunit}"`);
          retrievalResult = await this.retrievalService.retrieveForSubunitTitle(
            collectionName,
            unit,
            subunitTitle || subunit
          );
        }
      } else {
        // Unit-level retrieval (existing behavior)
        if (unitNumber !== undefined) {
             // Numeric unit identifier - filter by unitNumber metadata
             this.logger.log(`📚 Using numeric filter for Quiz Unit ${unitNumber}`);
             retrievalResult = await this.retrievalService.retrieveForUnit(
                collectionName, 
                unitNumber
             );
        } else {
             // String-based unit identifier - filter by unitTitle metadata
             this.logger.log(`📚 Using title filter for Quiz Unit "${unit}"`);
             retrievalResult = await this.retrievalService.retrieveForUnitTitle(
              collectionName,
              unit,
            );
        }
      }

      chunks = retrievalResult.chunks.map(c => c.text);
      sourceDetails = retrievalResult.sources;
      
      const logChunkTarget = subunit ? `Subunit "${subunit}"` : `Unit "${unit}"`;
      this.logger.log(`📘 Fetched ${chunks.length} chunks for Quiz from ${logChunkTarget}`);
    } catch (err: any) {
      this.logger.error(`Enhanced retrieval failed: ${err.message}`);
    }

    if (!chunks.length) {
      const errorTarget = subunit ? `subunit "${subunit}"` : `topic "${unit}"`;
      throw new InternalServerErrorException(
        `No content found for ${errorTarget} in ${gTitle} ${sTitle}. Please verify the name or try a more specific topic.`,
      );
    }

    // 4. Build Prompt (include subunit context if applicable)
    const promptTopic = subunit ? `${unit} - ${subunitTitle || subunit}` : unit;
    const prompt = this.buildQuizPrompt(promptTopic, chunks, num_questions, questionTypes);

    // 5. Call LLM
    const rawResponse = await this.callLLM(prompt);

    // 6. Parse
    const questions = this.parseLLMOutput(rawResponse);

    if (!questions.length) {
      throw new InternalServerErrorException('LLM returned no quiz questions.');
    }

    // 7. Save (with optional subunit field)
    const quizDoc = await this.quizModel.create({
      grade: gTitle,
      subject: sTitle,
      unit,
      subunit: subunit || undefined, // Only save if provided
      questions,
      source: 'ai-generated',
    });

    this.logger.log(`Quiz generated and saved: ${quizDoc._id}`);
    return quizDoc;
  }


  private async generateEmbedding(text: string): Promise<number[]> {
    return this.llmService.embed(text);
  }

  private buildQuizPrompt(unit: string, chunks: string[], num_questions: number, questionTypes: string[] = ['mcq']) {
    const shuffled = chunks.sort(() => 0.5 - Math.random());
    const textContent = shuffled.slice(0, 15).join('\n\n');
    
    // Build type-specific instructions
    const typeInstructions = this.getTypeInstructions(questionTypes);

    // Build dynamic example based on requested types
    const examples: any[] = [];
    if (questionTypes.includes('mcq')) {
      examples.push({
        type: "mcq",
        question: "What is photosynthesis?",
        options: ["A) Process of making food", "B) Process of breathing", "C) Process of digestion", "D) Process of excretion"],
        answer: "A",
        hint: "Think about how plants make their own food.",
        explanation: "Photosynthesis is the process by which plants use sunlight to make food from carbon dioxide and water."
      });
    }
    if (questionTypes.includes('true-false')) {
      examples.push({
        type: "true-false",
        question: "Mitochondria are the powerhouse of the cell.",
        answer: "true",
        hint: "Think about which organelle produces energy.",
        explanation: "Mitochondria produce ATP, the energy currency of cells, making them the powerhouse."
      });
    }
    if (questionTypes.includes('fill-blank')) {
      examples.push({
        type: "fill-blank",
        question: "The ___ is the basic unit of life.",
        answer: "cell",
        hint: "It's the smallest structural unit.",
        explanation: "The cell is the basic structural, functional, and biological unit of all known organisms."
      });
    }
    
    // If no specific example matches (e.g. mixed or other), default to MCQ
    if (examples.length === 0) {
      examples.push({
        type: "mcq",
        question: "Example question?",
        options: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
        answer: "A",
        hint: "Hint goes here",
        explanation: "Explanation goes here"
      });
    }

    return `
You are a strict expert quiz generator for Ethiopian high school students specifically for grade ${Grade} and subject ${Subject} and unit ${unit}.
Generate questions based ONLY on the text below.

🚫 CRITICAL RULES:
- Do NOT generate questions from general knowledge
- Do NOT infer information not present in the text
- Every question MUST be answerable from the provided context
- If the text is insufficient, generate FEWER questions rather than making up content

UNIT: ${unit}

TEXT:
${textContent}

RULES:
- Create exactly ${num_questions} questions.
- Use ONLY the following question types: ${questionTypes.join(', ')}.
- Do NOT include any other question types.
- Distribute questions evenly across the specified types.
- Each question MUST include:
  * "type": one of ${questionTypes.map(t => `"${t}"`).join(', ')}
  * "question": the question text
  * "answer": the correct answer
  * "hint": a helpful hint for the first wrong attempt
  * "explanation": detailed explanation for the second wrong attempt

${typeInstructions}

Return ONLY a valid JSON array. Example structure:

${JSON.stringify(examples, null, 2)}
`;
  }

  private getTypeInstructions(types: string[]): string {
    const instructions: string[] = [];
    
    if (types.includes('mcq')) {
      instructions.push(`
**Multiple Choice (MCQ)**:
- Provide 4 options labeled A, B, C, D
- Format: "options": ["A) text", "B) text", "C) text", "D) text"]
- "answer": "A" (just the letter)`);
    }
    
    if (types.includes('true-false')) {
      instructions.push(`
**True/False**:
- "answer": "true" or "false" (lowercase)
- No options field needed`);
    }
    
    if (types.includes('fill-blank')) {
      instructions.push(`
**Fill-in-the-Blank**:
- Use "___" in the question text to indicate the blank
- "answer": the word/phrase that fills the blank
- Example: "The ___ is the powerhouse of the cell." → "answer": "mitochondria"`);
    }
    
    if (types.includes('short-answer')) {
      instructions.push(`
**Short Answer**:
- Open-ended question requiring 1-3 sentences
- "answer": a concise model answer (2-3 sentences)
- Be flexible in grading - accept similar phrasings`);
    }
    
    if (types.includes('matching')) {
      instructions.push(`
**Matching**:
- Provide "pairs": array of objects with "left" and "right" properties
- "answer": "match-all" (indicates all pairs must be matched)
- Example: "pairs": [{"left": "Mitochondria", "right": "Energy production"}, {"left": "Nucleus", "right": "Genetic material"}]`);
    }
    
    return instructions.join('\n');
  }

  private async callLLM(prompt: string) {
    try {
        // Use the centralized LlmService which handles Gemini/Ollama switching
        const res = await this.llmService.generate(prompt, { 
            temperature: 0.5
        });
        return res.text;
    } catch (e: any) {
        throw new InternalServerErrorException(`LLM Quiz Generation failed: ${e.message}`);
    }
  }

  private parseLLMOutput(llmOutput: string) {
    let out = llmOutput.trim();
    out = out.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
    
    const start = out.indexOf('[');
    let end = out.lastIndexOf(']');
    
    // If no closing bracket, try to find where the JSON ends
    if (end === -1 || end < start) {
      this.logger.warn('Incomplete JSON detected, attempting to fix...');
      
      // Find the last complete object by looking for closing brace
      const lastClosingBrace = out.lastIndexOf('}');
      if (lastClosingBrace > start) {
        // Add closing bracket after last complete object
        out = out.substring(0, lastClosingBrace + 1) + '\n]';
        end = out.lastIndexOf(']');
        this.logger.log(`Fixed incomplete JSON by truncating at position ${lastClosingBrace}`);
      } else {
        throw new Error('LLM did not return a valid JSON array.');
      }
    } else {
      // Even if we have closing bracket, check if last object is complete
      const jsonStr = out.slice(start, end + 1);
      try {
        JSON.parse(jsonStr); // Test if it's valid
      } catch (e) {
        // If invalid, try to fix by removing incomplete last object
        this.logger.warn('JSON has closing bracket but is invalid, attempting to fix...');
        const lastClosingBrace = out.substring(0, end).lastIndexOf('}');
        if (lastClosingBrace > start) {
          out = out.substring(0, lastClosingBrace + 1) + '\n]';
          end = out.lastIndexOf(']');
          this.logger.log(`Fixed invalid JSON by removing incomplete object`);
        }
      }
    }

    if (start === -1) {
      throw new Error('LLM did not return a JSON array.');
    }

    const jsonStr = out.slice(start, end + 1);
    try {
        const parsed = JSON.parse(jsonStr);
        this.logger.log(`Successfully parsed ${parsed.length} questions from LLM response`);
        return parsed.map((q: any) => ({
          type: q.type || 'mcq',
          question: q.question,
          options: q.options,
          answer: q.answer ? q.answer.replace(/[).]/g, '').trim() : '',
          hint: q.hint || 'Think carefully about the question.',
          explanation: q.explanation || 'Review the material to understand this concept better.',
        }));
    } catch (e) {
        this.logger.error(`Failed to parse JSON: ${jsonStr.substring(0, 500)}...`);
        throw new Error('Invalid JSON from LLM');
    }
  }
}
