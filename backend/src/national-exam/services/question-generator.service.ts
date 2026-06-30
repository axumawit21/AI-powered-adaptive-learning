import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import {
  ModelExamQuestion,
  ModelExamQuestionDocument,
} from '../schemas/model-exam-question.schema';
import { BlueprintItem } from '../schemas/model-exam.schema';
import { LlmService } from '../../llm/llm.service';
import { RetrievalService } from '../../rag/services/retrieval.service';
import { Subject } from '../../subjects/subjects.schema';
import { Grade } from '../../grades/grades.schema';
import {
  ExamPaperQuestion,
  ExamPaperQuestionDocument,
} from '../../exam-paper/schemas/exam-paper-question.schema';
import {
  ExamPaper,
  ExamPaperDocument,
} from '../../exam-paper/schemas/exam-paper.schema';

interface GeneratedQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  shortExplanation: string;
  hint?: string; // Only included for practice exams
  requiresDiagram?: boolean; // Whether this question needs a diagram
  diagramDescription?: string; // Description for diagram generation
}

/**
 * RAG-based question generation service.
 * Retrieves textbook content and generates original MCQ questions.
 */
@Injectable()
export class QuestionGeneratorService {
  private readonly logger = new Logger(QuestionGeneratorService.name);

  constructor(
    @InjectModel(ModelExamQuestion.name)
    private questionModel: Model<ModelExamQuestionDocument>,
    @InjectModel(Subject.name)
    private subjectModel: Model<Subject>,
    @InjectModel(Grade.name)
    private gradeModel: Model<Grade>,
    @InjectModel(ExamPaperQuestion.name)
    private examPaperQuestionModel: Model<ExamPaperQuestionDocument>,
    @InjectModel(ExamPaper.name)
    private examPaperModel: Model<ExamPaperDocument>,
    private readonly llmService: LlmService,
    private readonly retrievalService: RetrievalService,
  ) {}

  /**
   * Generate questions for a model exam based on its blueprint
   */
  async generateQuestionsForBlueprint(
    modelExamId: string,
    subjectId: string,
    blueprint: BlueprintItem[],
    basedOnYears: number[] = [],
    examType: 'real' | 'practice' = 'practice',
  ): Promise<ModelExamQuestionDocument[]> {
    this.logger.log(
      `Generating questions for exam ${modelExamId} with ${blueprint.length} blueprint items`,
    );

    const subject = await this.subjectModel.findById(subjectId);
    if (!subject) {
      throw new Error(`Subject ${subjectId} not found`);
    }

    // Fetch sample questions from real entrance exams to use as style reference
    const sampleQuestions = await this.fetchSampleQuestionsFromRealExams(
      subjectId,
      basedOnYears,
    );
    this.logger.log(`Fetched ${sampleQuestions.length} sample questions from real entrance exams`);

    const generatedQuestions: ModelExamQuestionDocument[] = [];
    let questionNumber = 1;

    for (const item of blueprint) {
      this.logger.log(
        `Generating ${item.questionCount} ${item.difficulty} questions for Grade ${item.grade}, Unit ${item.unitNumber}`,
      );

      // Get the grade info (optional - we can still generate without it)
      const grade = await this.gradeModel.findOne({
        gradeNumber: item.grade,
      });

      // Note: Grade lookup is optional - we proceed even without it
      if (!grade) {
        this.logger.warn(`Grade ${item.grade} not found in database, proceeding anyway`);
      }

      // Retrieve textbook content for this unit
      const collectionName = this.retrievalService.getCollectionName(
        `Grade ${item.grade}`,
        subject.title,
      );

      let context = '';
      try {
        const retrievalResult = await this.retrievalService.retrieveForUnit(
          collectionName,
          item.unitNumber,
          2000,
        );
        context = retrievalResult.chunks
          .map((c) => c.text)
          .join('\n\n')
          .slice(0, 8000); // Limit context size
      } catch (error) {
        this.logger.warn(
          `Could not retrieve content for ${collectionName}, Unit ${item.unitNumber}: ${error.message}`,
        );
        // Use general knowledge as fallback
        context = `Generate questions based on Ethiopian Grade ${item.grade} ${subject.title} curriculum, Unit ${item.unitNumber}.`;
      }

      // Generate questions for this blueprint item
      const questions = await this.generateQuestionsFromContext(
        context,
        item,
        subject.title,
        item.questionCount,
        sampleQuestions,
        examType,
      );

      // Save generated questions (with diagram generation for eligible ones)
      for (const q of questions) {
        const questionData: any = {
          modelExamId: new Types.ObjectId(modelExamId),
          questionNumber: questionNumber++,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: item.difficulty,
          grade: item.grade,
          unitNumber: item.unitNumber,
          unitTitle: item.unitTitle,
          subunitNumber: item.subunitNumber,
          subunitTitle: item.subunitTitle,
          shortExplanation: q.shortExplanation,
          generatedAt: new Date(),
          hasImage: false, // Default to no image
        };
        
        // Only include hint for practice exams
        if (examType === 'practice' && q.hint) {
          questionData.hint = q.hint;
        }

        // Generate diagram if question requires it
        if (q.requiresDiagram && q.diagramDescription) {
          try {
            const diagramType = this.getDiagramTypeFromSubject(subject.title);
            this.logger.log(`🎨 Generating diagram for Q${questionData.questionNumber}: ${q.diagramDescription.substring(0, 50)}...`);
            
            const diagram = await this.llmService.generateEducationalDiagram(
              q.diagramDescription,
              diagramType,
            );

            // Save image to disk
            const imageUrl = await this.saveDiagramImage(
              modelExamId,
              questionData.questionNumber,
              diagram.imageBase64,
              diagram.mimeType,
            );

            questionData.hasImage = true;
            questionData.imageUrl = imageUrl;
            questionData.imageDescription = q.diagramDescription;
            
            this.logger.log(`✅ Diagram saved: ${imageUrl}`);
          } catch (error) {
            this.logger.error(`❌ Failed to generate diagram for Q${questionData.questionNumber}: ${error.message}`);
            // Continue without diagram - question is still valid
          }
        }
        
        const questionDoc = await this.questionModel.create(questionData);
        generatedQuestions.push(questionDoc);
      }

      // Add delay to avoid rate limiting
      await this.delay(500);
    }

    this.logger.log(
      `Generated ${generatedQuestions.length} questions for exam ${modelExamId}`,
    );

    return generatedQuestions;
  }

  /**
   * Fetch sample questions from approved exam papers to use as style reference
   */
  private async fetchSampleQuestionsFromRealExams(
    subjectId: string,
    years: number[],
  ): Promise<Array<{ question: string; options: any; correctAnswer: string }>> {
    try {
      // Find valid exam papers first
      const query: any = {
        subjectId: new Types.ObjectId(subjectId),
        status: 'approved',
      };

      if (years && years.length > 0) {
        query.examYear = { $in: years };
      }

      const examPapers = await this.examPaperModel.find(query).select('_id');
      const examPaperIds = examPapers.map((ep) => ep._id);

      if (examPaperIds.length === 0) {
        return [];
      }

      // Fetch 3 random questions from these papers
      const samples = await this.examPaperQuestionModel.aggregate([
        { $match: { examPaperId: { $in: examPaperIds }, approvalStatus: 'approved' } },
        { $sample: { size: 3 } },
        {
          $project: {
            question: 1,
            options: 1,
            correctAnswer: 1,
            _id: 0,
          },
        },
      ]);

      return samples;
    } catch (error) {
      this.logger.error(`Error fetching sample questions: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate questions from retrieved context
   */
  private async generateQuestionsFromContext(
    context: string,
    blueprintItem: BlueprintItem,
    subjectTitle: string,
    count: number,
    sampleQuestions: Array<{ question: string; options: any; correctAnswer: string }> = [],
    examType: 'real' | 'practice' = 'practice',
  ): Promise<GeneratedQuestion[]> {
    const prompt = this.buildQuestionGenerationPrompt(
      context,
      blueprintItem,
      subjectTitle,
      count,
      sampleQuestions,
      examType,
    );

    try {
      const response = await this.llmService.generate(prompt, { format: 'json' });
      return this.parseGeneratedQuestions(response.text, examType);
    } catch (error) {
      this.logger.error(`Error generating questions: ${error.message}`);
      // Return placeholder questions on error
      return this.generatePlaceholderQuestions(blueprintItem, count);
    }
  }

  /**
   * Build the LLM prompt for question generation
   */
  private buildQuestionGenerationPrompt(
    context: string,
    blueprintItem: BlueprintItem,
    subjectTitle: string,
    count: number,
    sampleQuestions: Array<{ question: string; options: any; correctAnswer: string }> = [],
    examType: 'real' | 'practice' = 'practice',
  ): string {
    const difficultyDescriptions = {
      easy: 'Basic recall and recognition questions. Students should be able to answer with direct knowledge from the textbook.',
      medium:
        'Understanding and application questions. Require comprehension and ability to apply concepts.',
      hard: 'Analysis and problem-solving questions. Require deeper understanding, multi-step reasoning, or synthesis of concepts.',
    };

    // Format sample questions string
    let sampleQuestionsSection = '';
    if (sampleQuestions.length > 0) {
      const examples = sampleQuestions
        .slice(0, 3)
        .map(
          (q, i) => `
Example ${i + 1}:
Question: ${q.question}
Options: A) ${q.options.A}, B) ${q.options.B}, C) ${q.options.C}, D) ${q.options.D}
Answer: ${q.correctAnswer}
`,
        )
        .join('\n');

      sampleQuestionsSection = `
STYLE REFERENCE (Actual Ethiopian Entrance Exam Questions):
The following questions are from real past exams. Mimic their style, tone, and complexity:
${examples}
`;
    }

    // Check if this subject typically uses diagrams
    const isDiagramEligible = this.isDiagramEligibleSubject(subjectTitle);
    
    // Determine output format based on exam type
    const isPractice = examType === 'practice';
    const hintInstruction = isPractice 
      ? '- Include a helpful hint that guides students toward the answer without giving it away directly\n'
      : '';
    
    // Diagram instructions for eligible subjects
    const diagramInstructions = isDiagramEligible ? `
DIAGRAM-BASED QUESTIONS:
For ${subjectTitle}, some questions should require visual diagrams (like real entrance exams).
For at least 1-2 questions per batch, create questions that reference a diagram:
- Set "requiresDiagram": true
- Include "diagramDescription": a DETAILED description of what the diagram should show
- The question text should reference the diagram (e.g., "Referring to the diagram below...", "The figure shows...")

Examples of diagram-appropriate questions:
- Biology: cell structures, anatomical diagrams, ecosystem charts, food webs
- Chemistry: molecular structures, reaction mechanisms, apparatus setups
- Physics: circuit diagrams, force vectors, wave patterns, motion graphs
- Math: coordinate graphs, geometric figures, function plots
` : '';
    
    // Build output format with diagram fields for eligible subjects
    const baseFields = `    "question": "The question text here?",
    "options": {
      "A": "First option",
      "B": "Second option",
      "C": "Third option",
      "D": "Fourth option"
    },
    "correctAnswer": "B",
    "shortExplanation": "Brief explanation of why B is correct."`;
    
    const hintField = isPractice ? `,
    "hint": "A helpful hint that guides students toward the answer."` : '';
    
    const diagramFields = isDiagramEligible ? `,
    "requiresDiagram": false,
    "diagramDescription": null` : '';
    
    const outputFormat = `OUTPUT FORMAT (JSON array):
[
  {
${baseFields}${hintField}${diagramFields}
  }
]

${isDiagramEligible ? `For diagram questions, set requiresDiagram: true and provide a detailed diagramDescription.
Example diagram question:
{
  "question": "Referring to the diagram below, identify the structure labeled X.",
  "options": { "A": "Mitochondria", "B": "Nucleus", "C": "Ribosome", "D": "Golgi apparatus" },
  "correctAnswer": "B",
  "shortExplanation": "The structure labeled X is centrally located and contains genetic material.",
  "requiresDiagram": true,
  "diagramDescription": "A labeled diagram of an animal cell showing the nucleus (labeled X) in the center, with mitochondria, ribosomes, endoplasmic reticulum, and Golgi apparatus surrounding it. All organelles should be clearly labeled except for the nucleus which is marked with X."
}` : ''}`;

    return `You are an expert Ethiopian entrance examination question writer for ${subjectTitle}.

CONTEXT FROM TEXTBOOK:
${context}

${sampleQuestionsSection}

TASK:
Generate exactly ${count} ORIGINAL multiple-choice questions for the Ethiopian National Entrance Examination.
This is a ${examType.toUpperCase()} exam${isPractice ? ' (practice mode with hints)' : ' (timed exam without hints)'}.

REQUIREMENTS:
1. Grade Level: Grade ${blueprintItem.grade}
2. Unit: ${blueprintItem.unitTitle}
3. Difficulty: ${blueprintItem.difficulty.toUpperCase()} - ${difficultyDescriptions[blueprintItem.difficulty]}

STRICT RULES:
- Create ORIGINAL questions, NOT copied from any existing exam
- Questions must be based on the provided context
- Each question must have exactly 4 options (A, B, C, D)
- Options should be plausible - avoid obviously wrong answers
- Correct answer must be factually accurate
- Match the formal tone of Ethiopian entrance examinations
- Include a brief explanation for each correct answer
${hintInstruction}${diagramInstructions}
${outputFormat}

Generate ${count} questions now:`;
  }


  /**
   * Parse LLM response into structured questions
   */
  private parseGeneratedQuestions(
    response: string,
    examType: 'real' | 'practice' = 'practice',
  ): GeneratedQuestion[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.warn('No JSON array found in response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        this.logger.warn('Parsed response is not an array');
        return [];
      }

      return parsed.map((q: any) => {
        const question: GeneratedQuestion = {
          question: q.question || '',
          options: {
            A: q.options?.A || '',
            B: q.options?.B || '',
            C: q.options?.C || '',
            D: q.options?.D || '',
          },
          correctAnswer: this.validateAnswer(q.correctAnswer),
          shortExplanation: q.shortExplanation || 'No explanation provided.',
        };
        
        // Only include hint for practice exams
        if (examType === 'practice' && q.hint) {
          question.hint = q.hint;
        }

        // Include diagram fields if present
        if (q.requiresDiagram === true && q.diagramDescription) {
          question.requiresDiagram = true;
          question.diagramDescription = q.diagramDescription;
        }
        
        return question;
      });
    } catch (error) {
      this.logger.error(`Error parsing questions: ${error.message}`);
      return [];
    }
  }

  /**
   * Validate and normalize answer
   */
  private validateAnswer(answer: any): 'A' | 'B' | 'C' | 'D' {
    const normalized = String(answer).toUpperCase().trim();
    if (['A', 'B', 'C', 'D'].includes(normalized)) {
      return normalized as 'A' | 'B' | 'C' | 'D';
    }
    return 'A'; // Default fallback
  }

  /**
   * Generate placeholder questions when LLM fails
   */
  private generatePlaceholderQuestions(
    blueprintItem: BlueprintItem,
    count: number,
  ): GeneratedQuestion[] {
    const placeholders: GeneratedQuestion[] = [];

    for (let i = 0; i < count; i++) {
      placeholders.push({
        question: `[Placeholder] Question about Grade ${blueprintItem.grade} ${blueprintItem.unitTitle} - ${blueprintItem.difficulty} difficulty`,
        options: {
          A: 'Option A',
          B: 'Option B',
          C: 'Option C',
          D: 'Option D',
        },
        correctAnswer: 'A',
        shortExplanation:
          'This is a placeholder question. Please regenerate or edit manually.',
      });
    }

    return placeholders;
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Delete all questions for a model exam
   */
  async deleteQuestionsForExam(modelExamId: string): Promise<number> {
    const result = await this.questionModel.deleteMany({
      modelExamId: new Types.ObjectId(modelExamId),
    });
    return result.deletedCount;
  }

  /**
   * Get questions for a model exam
   */
  async getQuestionsForExam(
    modelExamId: string,
  ): Promise<ModelExamQuestionDocument[]> {
    return this.questionModel
      .find({ modelExamId: new Types.ObjectId(modelExamId) })
      .sort({ questionNumber: 1 });
  }

  /**
   * Determine diagram type based on subject title
   */
  private getDiagramTypeFromSubject(subjectTitle: string): 'biology' | 'chemistry' | 'physics' | 'math' {
    const title = subjectTitle.toLowerCase();
    
    if (title.includes('biology') || title.includes('bio')) {
      return 'biology';
    } else if (title.includes('chemistry') || title.includes('chem')) {
      return 'chemistry';
    } else if (title.includes('physics') || title.includes('phys')) {
      return 'physics';
    } else if (title.includes('math') || title.includes('mathematics')) {
      return 'math';
    }
    
    // Default to biology for unknown subjects
    return 'biology';
  }

  /**
   * Check if a subject typically requires diagrams
   */
  private isDiagramEligibleSubject(subjectTitle: string): boolean {
    const eligibleSubjects = [
      'biology', 'bio',
      'chemistry', 'chem',
      'physics', 'phys',
      'mathematics', 'math',
      'geography', 'geo',
    ];
    
    const title = subjectTitle.toLowerCase();
    return eligibleSubjects.some(s => title.includes(s));
  }

  /**
   * Save generated diagram image to disk
   * @returns URL path to the saved image
   */
  private async saveDiagramImage(
    modelExamId: string,
    questionNumber: number,
    base64Data: string,
    mimeType: string,
  ): Promise<string> {
    // Determine file extension from mime type
    const extension = mimeType.includes('png') ? 'png' : 
                      mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 
                      mimeType.includes('webp') ? 'webp' : 'png';
    
    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'model-exam-images', modelExamId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate filename
    const filename = `q${questionNumber}_diagram_${Date.now()}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Decode base64 and save to file
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filepath, buffer);

    // Return relative URL for frontend access
    return `/uploads/model-exam-images/${modelExamId}/${filename}`;
  }
}

