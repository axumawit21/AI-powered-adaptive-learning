import { Injectable, NotFoundException, Logger, InternalServerErrorException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExamSession } from './schemas/exam-session.schema';
import { GenerateExamDto, SubmitExamDto } from './dto/exam.dto';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import { QDRANT } from '../common/qdrant.provider';
import type { QdrantClient } from '@qdrant/js-client-rest';
import axios from 'axios';
import { ProgressService } from '../progress/progress.service';

import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../rag/services/retrieval.service';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    @InjectModel(ExamSession.name) private examModel: Model<ExamSession>,
    @InjectModel(Grade.name) private gradeModel: Model<Grade>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @Inject(QDRANT) private readonly qdrant: QdrantClient,
    private readonly progressService: ProgressService,
    private readonly llmService: LlmService,
    private readonly retrievalService: RetrievalService,
  ) {}

  async generateExam(studentId: string, dto: GenerateExamDto) {
    this.logger.log(`Generate Exam Request: ${JSON.stringify(dto)}`);
    const { subjectId, unitId, type, gradeId, numQuestions = 10 } = dto;

    // 1. Resolve Grade and Subject
    let gTitle = "Unknown Grade";
    let sTitle = "Unknown Subject";
    let finalGradeId: string | null = null;
    let finalSubjectId: string | null = null;

    // Helper
    const isValidId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

    // Resolve Grade
    if (gradeId && isValidId(gradeId)) {
      const g = await this.gradeModel.findById(gradeId);
      if (g) { finalGradeId = g._id.toString(); gTitle = g.title; }
    } else if (gradeId) {
       const g = await this.gradeModel.findOne({ title: new RegExp(gradeId, 'i') });
       if (g) { finalGradeId = g._id.toString(); gTitle = g.title; }
       else { gTitle = gradeId; finalGradeId = null; } 
    }

    // Resolve Subject
    if (isValidId(subjectId)) {
      const s = await this.subjectModel.findById(subjectId);
      if (s) { finalSubjectId = s._id.toString(); sTitle = s.title; }
    } else {
        const s = await this.subjectModel.findOne({ title: new RegExp(subjectId, 'i') });
        if (s) { finalSubjectId = s._id.toString(); sTitle = s.title; }
        else { sTitle = subjectId; finalSubjectId = null; }
    }
    
    // Get Collection Name
    const collectionName = `${gTitle}_${sTitle}`.replace(/\s+/g, '_').replace(/[^\w_]/g, '').toLowerCase();
    
    // 2. Search Content using RetrievalService
    let chunks: string[] = [];
    try {
        // Check if unitId is a number for strict isolation
        const unitNumber = unitId && !isNaN(Number(unitId)) ? Number(unitId) : undefined;
        
        let retrievalResult;
        
        if (type === 'unit' && unitId) {
            if (unitNumber !== undefined) {
                // Numeric unit identifier - filter by unitNumber metadata
                this.logger.log(`📚 Using numeric filter for Exam Unit ${unitNumber}`);
                retrievalResult = await this.retrievalService.retrieveForUnit(
                  collectionName, 
                  unitNumber
                );
            } else {
                // String-based unit identifier - filter by unitTitle metadata
                this.logger.log(`📚 Using title filter for Exam Unit "${unitId}"`);
                retrievalResult = await this.retrievalService.retrieveForUnitTitle(
                  collectionName,
                  unitId,
                );
            }
        } else {
            // Full subject exam - get broader content
            this.logger.log(`📚 Using semantic search for full subject exam`);
            retrievalResult = await this.retrievalService.retrieve({
              collectionName,
              query: `${sTitle} core concepts main topics`,
              limit: 50,
              useSlidingWindow: true,
              windowSize: 1,
            });
        }
        
        chunks = retrievalResult.chunks.map(c => c.text);
        this.logger.log(`📘 Fetched ${chunks.length} chunks for Exam`);
    } catch (e: any) {
        this.logger.warn(`Retrieval failed: ${e.message}`);
    }

    // 3. Generate Questions using LLM
    if (!chunks || chunks.length === 0) {
        throw new InternalServerErrorException(
            `No content found for this exam scope in ${gTitle} ${sTitle}. Please ensure the material is uploaded.`
        );
    }

    const prompt = this.buildExamPrompt(gTitle, sTitle, type === 'unit' ? (unitId || 'General Unit') : 'Full Subject', chunks, numQuestions);
    const questions = await this.callLLM(prompt);

    return this.examModel.create({
      studentId,
      subjectId: finalSubjectId || subjectId,
      subjectTitle: sTitle, // Populating title for matching robustness
      gradeId: finalGradeId, // SAVE GRADE ID
      unitId,
      type,
      totalQuestions: questions.length,
      questions
    });
  }

  async submitExam(studentId: string, dto: SubmitExamDto) {
    const exam = await this.examModel.findOne({ _id: dto.examId, studentId });
    if (!exam) throw new NotFoundException('Exam not found');

    let correctCount = 0;
    const answerData: { questionIndex: number; correct: boolean }[] = []; 

    dto.answers.forEach(ans => {
      const q = exam.questions[ans.questionIndex];
      if (q) {
        q.studentAnswer = ans.answer;
        if (!ans.answer || !q.correctAnswer) {
          q.isCorrect = false;
        } else {
            const normStudent = ans.answer.trim().toLowerCase();
            const normCorrect = q.correctAnswer.trim().toLowerCase();
            q.isCorrect = normStudent === normCorrect || normStudent.includes(normCorrect); 
        }
        
        if (q.isCorrect) correctCount++;
        
        answerData.push({ 
            questionIndex: ans.questionIndex, 
            correct: !!q.isCorrect 
        });
      }
    });

    exam.score = correctCount;
    exam.completed = true;
    exam.completedAt = new Date();
    
    await exam.save();

    // --- PROGRESS SYNC ---
    let unitNumber = 1;
    if (exam.unitId) {
        const match = exam.unitId.match(/\d+/);
        if (match) unitNumber = parseInt(match[0], 10);
    }

    try {
        await this.progressService.addExamResult(studentId, {
            bookId: `${exam.subjectId}_${exam.gradeId || 'General'}`,
            gradeId: exam.gradeId,
            subjectId: exam.subjectId,
            score: correctCount,
            totalQuestions: exam.totalQuestions,
        });
        this.logger.log(`Progress updated for student ${studentId}`);
    } catch (e) {
        this.logger.error(`Failed to update progress for exam ${exam._id}: ${e.message}`);
    }

    return exam;
  }

  // ... existing getters ...

  async getResults(examId: string) {
    return this.examModel.findById(examId);
  }

  async getHistory(studentId: string) {
    return this.examModel
      .find({ studentId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-questions')
      .lean()
      .exec();
  }

  // --- Helpers ---

  private async generateEmbedding(text: string): Promise<number[]> {
    return this.llmService.embed(text);
  }

  private buildExamPrompt(grade: string, subject: string, scope: string, context: string[], numQuestions: number = 10) {
      const contextText = context.join('\n\n').slice(0, 20000);
      return `
You are an expert examiner for ${grade} ${subject}.
Generate a challenging exam for scope: "${scope}".

📖 Reference Material (STRICT - Use ONLY this content):
${contextText}

🚫 CRITICAL RULES:
- Generate questions ONLY from the Reference Material above
- Do NOT use general knowledge or external information
- Do NOT infer answers not explicitly stated in the material
- Every question must be directly answerable from the provided text
- If the material is insufficient, generate FEWER questions rather than making up content

Task: Create exactly ${numQuestions} distinct mixed questions (Multiple Choice, True/False, Fill in Blank).
IMPORTANT Requirements:
1. Mix question formats: Include at least 1 Multiple Choice, 1 True/False, and 1 Fill in the Blank.
2. Questions must be CLEAR, CONCISE, and focus on MAIN CONCEPTS from the material.
3. Each question should test understanding of a KEY CONCEPT or important fact.
4. Avoid ambiguous wording - questions should have ONE clear correct answer.
5. Questions must be solvable based on the Reference Material (if provided) or general subject knowledge.
6. "fill_blank" questions must have a specific, single-word or short-phrase answer.
7. "multiple_choice" must have 4 plausible options with only ONE clearly correct answer.
8. Ensure questions cover different topics/concepts (no repetition).

Return ONLY a valid JSON object with a "questions" key.

Format:
{
"questions": [
  {
    "questionText": "Question here?",
    "type": "multiple_choice", // "multiple_choice" | "true_false" | "fill_blank"
    "options": ["A", "B", "C", "D"], // Required for MC and T/F
    "correctAnswer": "A" // or "True" or "word"
  }
]
}
`;
  }

  async evaluateUnderstanding(
    studentId: string, 
    dto: { grade: string; subject: string; unitIdentifier: string; studentInput?: string },
    file?: Express.Multer.File
  ) {
    const { grade, subject, unitIdentifier, studentInput } = dto;
    const gTitle = grade;
    
    let finalStudentInput = studentInput || '';
    
    // If file is uploaded, extract text from image using vision
    if (file) {
      this.logger.log(`Processing uploaded notes file: ${file.originalname} (${file.mimetype})`);
      
      try {
        // Convert file buffer to base64 for vision API
        const base64Image = file.buffer.toString('base64');
        const mimeType = file.mimetype || 'image/jpeg';
        
        // Use LLM vision to extract text from handwritten notes
        const extractionPrompt = `You are an expert at reading handwritten notes. 
Please carefully extract ALL the text content from this student's handwritten notes about "${unitIdentifier}" in ${subject}.

Instructions:
1. Read the handwritten text carefully and transcribe it as accurately as possible
2. Preserve the structure and organization of the notes
3. If something is unclear, make your best interpretation
4. Include any diagrams or concepts described visually
5. Return ONLY the extracted text content, nothing else`;

        const visionResult = await this.llmService.generateWithImage(
          extractionPrompt,
          base64Image,
          mimeType
        );
        
        const extractedText = visionResult.text;
        this.logger.log(`Extracted ${extractedText.length} characters from uploaded notes`);
        
        // Combine extracted text with any typed input
        if (finalStudentInput) {
          finalStudentInput = `${finalStudentInput}\n\n[Handwritten Notes Transcription]:\n${extractedText}`;
        } else {
          finalStudentInput = extractedText;
        }
      } catch (e) {
        this.logger.error(`Failed to extract text from image: ${e.message}`);
        // Fall back to just using text input if vision fails
        if (!finalStudentInput) {
          throw new Error('Failed to read handwritten notes. Please type your explanation instead.');
        }
      }
    }
    
    if (!finalStudentInput || finalStudentInput.trim().length === 0) {
      throw new Error('No input provided. Please type your explanation or upload handwritten notes.');
    }
    
    const collectionName = `${grade}_${subject}`.replace(/\s+/g, '_').replace(/[^\w_]/g, '').toLowerCase();

    // 1. Search Context (Ground Truth for the Topic)
    let chunks: string[] = [];
    try {
        this.logger.log(`Evaluating using collection: ${collectionName} for topic: ${unitIdentifier}`);
        
        // Search primarily for the TOPIC to get the "Truth"
        const vector = await this.generateEmbedding(`${unitIdentifier} in ${subject}`);
        const searchRes = await this.qdrant.search(collectionName, {
            vector,
            limit: 5
        });
        chunks = searchRes.map((r: any) => r.payload?.text).filter(Boolean);
        
        this.logger.log(`Found ${chunks.length} chunks for validation.`);

    } catch (e) {
        this.logger.warn("Context search failed for evaluation", e);
    }

    // 2. Build Prompt
    const prompt = this.buildEvaluationPrompt(grade, subject, unitIdentifier, finalStudentInput, chunks);

    // 3. Call LLM
    try {
        const res = await this.llmService.generate(prompt, { format: 'json', temperature: 0.1 });
        const text = res.text;
        
        this.logger.log(`LLM Raw Response: ${text}`); // Debug log

        // Improved JSON parsing (handle markdown code blocks)
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error(`No JSON found in response. Raw text: ${text.substring(0, 100)}...`);
        
        const jsonStr = text.substring(jsonStart, jsonEnd + 1);
        try {
             return JSON.parse(jsonStr);
        } catch (parseError) {
             throw new Error(`JSON Parse Error: ${parseError.message}. Content: ${jsonStr}`);
        }

    } catch (e) {
        this.logger.error("Evaluation generation failed", e.stack);
        return { 
            score: 0, 
            feedback: `System Error: ${e.message || "Unknown error"}. Please try again.`
        };
    }
  }

  private buildEvaluationPrompt(grade: string, subject: string, topic: string, input: string, context: string[]) {
      if (context.length === 0) {
        throw new InternalServerErrorException(
          `No reference material found for evaluating "${topic}" in ${subject}. Please ensure the topic exists in the textbook.`
        );
      }
      const contextText = context.join('\n\n').slice(0, 10000);
      return `
You are an expert teacher. Evaluate the student's understanding.
Subject: ${subject}
Topic: ${topic}

Reference Material (Ground Truth):
${contextText}

Student's Input:
"${input}"

Instructions:
1. Compare Student's Input matches the Reference Material (or general truth if Reference is missing).
2. Assess factual accuracy, depth, and clarity.
3. If the input is correct but simple, give a moderate score (e.g., 70-80).
4. If the input is detailed and accurate, give a high score (90-100).
5. If the input is incorrect or irrelevant, give a low score.
6. IGNORE spelling/grammar errors unless they obscure meaning.
7. Provide the output in JSON format.

Output strictly valid JSON:
{
  "score": number, // 0-100
  "feedback": "string" // Constructive feedback.
}
`;
  }

  private async callLLM(prompt: string): Promise<any[]> {
      try {
        this.logger.log('Calling LLM for exam generation...');
        const res = await this.llmService.generate(prompt, { format: 'json', temperature: 0.5 });
        const text = res.text;
        
        this.logger.log(`Exam Gen Raw Response: ${text.substring(0, 500)}...`);

        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = text.substring(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonStr);
            if (parsed.questions && Array.isArray(parsed.questions)) {
                this.logger.log(`Successfully generated ${parsed.questions.length} questions`);
                return parsed.questions;
            }
        }
        
        // Fallback for array root if model ignores instruction
        const arrayStart = text.indexOf('[');
        const arrayEnd = text.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd !== -1) {
             const questions = JSON.parse(text.substring(arrayStart, arrayEnd + 1));
             this.logger.log(`Successfully generated ${questions.length} questions (array format)`);
             return questions;
        }

        this.logger.error("Invalid LLM response structure");
        throw new Error("Invalid structure");

      } catch (e) {
          this.logger.error('LLM Generation failed', e.message, e.stack);
          // Fallback to mock if AI fails
          return [
              {
                  questionText: "AI Generation failed. Please try again.",
                  type: "true_false",
                  options: ["True", "False"],
                  correctAnswer: "True"
              }
          ];
      }
  }

}
