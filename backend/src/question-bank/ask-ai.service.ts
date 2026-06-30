import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../rag/services/retrieval.service';
import { AskAIDto } from './dto/ask-ai.dto';
import { EnhancedChunkPayload } from '../rag/interfaces/chunk-payload.interface';

/**
 * AskAIService
 * 
 * Provides RAG-powered AI tutoring for quiz questions.
 * Retrieves learning content filtered by question metadata (grade, subject, unit, subunit)
 * to give contextually relevant explanations.
 */
@Injectable()
export class AskAIService {
  private readonly logger = new Logger(AskAIService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly retrievalService: RetrievalService,
  ) {}

  /**
   * Ask AI about a specific quiz question
   * Uses question metadata to retrieve relevant learning chunks from Qdrant
   */
  async askAboutQuestion(dto: AskAIDto): Promise<{
    answer: string;
    sources: { unitTitle: string; pageRange: string }[];
  }> {
    const {
      questionId,
      userMessage,
      questionText,
      gradeTitle,
      subjectTitle,
      unitNumber,
      unitTitle,
      subunitNumber,
      subunitTitle,
    } = dto;

    this.logger.log(
      `🤖 Ask AI request for question ${questionId} | Unit: ${unitNumber} | Subunit: ${subunitNumber || 'N/A'}`,
    );

    // 1. Build collection name from grade and subject
    const collectionName = this.retrievalService.getCollectionName(gradeTitle, subjectTitle);

    // 2. Retrieve chunks based on question metadata
    let chunks: EnhancedChunkPayload[] = [];
    let sources: { unitTitle: string; pageRange: string }[] = [];

    try {
      if (subunitNumber) {
        // If question has subunit, filter by unit AND subunit
        this.logger.log(`📗 Retrieving chunks for Unit ${unitNumber}, Subunit ${subunitNumber}`);
        const result = await this.retrievalService.retrieveForSubunit(
          collectionName,
          unitNumber,
          subunitNumber,
          50, // Limit chunks for focused context
        );
        chunks = result.chunks;
        sources = result.sources;
      } else {
        // If no subunit, filter by unit only
        this.logger.log(`📘 Retrieving chunks for Unit ${unitNumber}`);
        const result = await this.retrievalService.retrieveForUnit(
          collectionName,
          unitNumber,
          50, // Limit chunks for focused context
        );
        chunks = result.chunks;
        sources = result.sources;
      }

      this.logger.log(`📚 Retrieved ${chunks.length} chunks from Qdrant`);
    } catch (error) {
      this.logger.warn(`Failed to retrieve chunks: ${error.message}`);
    }

    // 3. Build prompt for AI tutor
    const prompt = this.buildTutoringPrompt(
      questionText,
      userMessage,
      chunks,
      gradeTitle,
      subjectTitle,
      unitTitle,
      subunitTitle,
    );

    // 4. Generate AI response
    let answer: string;
    try {
      const response = await this.llmService.generate(prompt, { temperature: 0.7 });
      answer = response.text.trim();
    } catch (error) {
      this.logger.error(`LLM generation failed: ${error.message}`);
      answer = `I'm sorry, I couldn't generate an explanation at this time. Please try again later.`;
    }

    return { answer, sources };
  }

  /**
   * Build a focused tutoring prompt for explaining the question concept
   */
  private buildTutoringPrompt(
    questionText: string,
    userMessage: string,
    chunks: EnhancedChunkPayload[],
    gradeTitle: string,
    subjectTitle: string,
    unitTitle: string,
    subunitTitle?: string,
  ): string {
    // Build context from retrieved chunks
    const contextText = chunks.length > 0
      ? chunks.slice(0, 10).map((chunk, i) => {
          const header = chunk.contextualHeader || `${chunk.unitTitle}`;
          return `[${i + 1}] ${header}:\n${chunk.text}`;
        }).join('\n\n---\n\n')
      : 'No specific textbook content available for this topic.';

    const topicLabel = subunitTitle 
      ? `${unitTitle} - ${subunitTitle}` 
      : unitTitle;

    return `
You are Lumi, a friendly and helpful AI tutor for ${gradeTitle} ${subjectTitle} students.

📚 TOPIC: ${topicLabel}

📖 TEXTBOOK CONTENT:
${contextText}

---

🎯 QUIZ QUESTION THE STUDENT IS WORKING ON:
"${questionText}"

💬 STUDENT'S MESSAGE:
"${userMessage}"

---

📝 YOUR TASK:
Help the student understand the concept behind this quiz question. Follow these rules:

1. **Be clear and concise** - Give a short, focused explanation (3-5 sentences max)
2. **Use the textbook content** - Base your explanation on the provided material
3. **Don't give away the answer** - Help them understand the concept WITHOUT revealing the correct answer
4. **Be encouraging** - Use friendly language and emojis 🎯
5. **Stay on topic** - Focus only on what's relevant to understand this question

If the student asks for the answer directly, gently redirect them to think about the concept instead.

💡 RESPONSE:
`;
  }
}
