import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { REDIS } from '../common/redis.provider';
import type Redis from 'ioredis';
import { QDRANT } from '../common/qdrant.provider';
import type { QdrantClient } from '@qdrant/js-client-rest';
import { ChatSession } from './schemas/chat-session.schema';
import { LlmService } from '../llm/llm.service';
import { RetrievalService } from '../rag/services/retrieval.service';
import { EnhancedChunkPayload } from '../rag/interfaces/chunk-payload.interface';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(QDRANT) private readonly qdrant: QdrantClient,
    @InjectModel(ChatSession.name) private readonly chatSessionModel: Model<ChatSession>,
    private readonly llmService: LlmService,
    private readonly retrievalService: RetrievalService,
  ) {}

  /* ═══════════════════════════════════════════════════════════════
     SESSION MANAGEMENT
     ═══════════════════════════════════════════════════════════════ */

  async createSession(studentId: string, firstMessage?: string, meta?: { grade?: string; subject?: string }) {
    const title = firstMessage
      ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
      : 'New Chat';
    return this.chatSessionModel.create({ studentId, title, grade: meta?.grade, subject: meta?.subject, messages: [] });
  }

  async getStudentSessions(studentId: string) {
    return this.chatSessionModel.find({ studentId }).sort({ updatedAt: -1 }).limit(500)
      .select('title subject grade updatedAt createdAt').lean().exec();
  }

  async getSession(sessionId: string) {
    return this.chatSessionModel.findById(sessionId);
  }

  async deleteSession(sessionId: string) {
    return this.chatSessionModel.findByIdAndDelete(sessionId);
  }

  async addMessage(sessionId: string, role: 'user' | 'assistant', content: string, context?: any) {
    return this.chatSessionModel.findByIdAndUpdate(
      sessionId,
      { $push: { messages: { role, content, timestamp: new Date(), context } } },
      { new: true },
    );
  }

  async updateSessionTitle(sessionId: string, title: string) {
    return this.chatSessionModel.findByIdAndUpdate(sessionId, { title }, { new: true });
  }

  /* ═══════════════════════════════════════════════════════════════
     MAIN Q&A PIPELINE
     ═══════════════════════════════════════════════════════════════ */

  async askByGradeSubject(
    grade: string,
    subject: string,
    question: string,
    sessionId?: string,
    studentId?: string,
    selectedUnit?: number,
    selectedSubunit?: string,
    unitTitle?: string,
    subunitTitle?: string,
  ) {
    this.logger.log(
      `📥 Q&A | "${question.substring(0, 80)}" | Unit=${selectedUnit ?? unitTitle ?? '—'} Sub=${selectedSubunit ?? subunitTitle ?? '—'}`,
    );

    // 1. Save user message
    if (sessionId) {
      await this.addMessage(sessionId, 'user', question, {
        grade, subject, selectedUnit, selectedSubunit, unitTitle, subunitTitle,
      });
    }

    // 2. Load conversation history (last 10 messages = 5 exchanges)
    const history = await this.loadHistory(sessionId);

    // 3. Classify the question
    const type = this.classifyQuestion(question, history);
    this.logger.log(`🏷️ Type: ${type}`);

    // 4. Handle greetings — fast path, no retrieval needed
    if (type === 'greeting') {
      const answer = await this.callLLM(
        `You are Lumi, a friendly AI tutor. The student said: "${question}". ` +
        `Respond warmly in 1-2 sentences and ask how you can help with their ${subject} studies.`,
      );
      if (sessionId) await this.addMessage(sessionId, 'assistant', answer);
      return { ok: true, answer, source: 'general' };
    }

    // 5. Resolve follow-ups into standalone questions for better retrieval
    let searchQuery = question;
    if (type === 'follow-up' && history.length > 0) {
      searchQuery = await this.resolveFollowUp(question, history, subject);
      this.logger.log(`🔄 Resolved: "${question}" → "${searchQuery.substring(0, 80)}"`);
    }

    // 6. Retrieve relevant textbook chunks
    const collectionName = this.collectionName(grade, subject);
    const isGeneric = subject === 'Lumi AI' || subject === 'General';
    let chunks: EnhancedChunkPayload[] = [];
    let sources: { unitTitle: string; pageRange: string }[] = [];

    if (!isGeneric) {
      ({ chunks, sources } = await this.retrieveChunks(
        collectionName, searchQuery, subject,
        selectedUnit, selectedSubunit, unitTitle, subunitTitle,
      ));
    }

    // 7. Generate the answer
    let answer: string;

    if (chunks.length > 0) {
      // ── RAG answer from textbook ──
      const prompt = this.buildPrompt(
        question, searchQuery, chunks, sources,
        `${grade} — ${subject}`, history, unitTitle, subunitTitle,
      );
      answer = await this.callLLM(prompt);

      // Append source citation if LLM didn't include one
      if (!answer.includes('📚')) {
        const cite = sources.map(s => `${s.unitTitle} (${s.pageRange})`).join(', ');
        answer += `\n\n---\n📚 **Source:** ${cite}`;
      }
    } else if (isGeneric) {
      // ── Generic / "Lumi AI" (no textbook) ──
      const ctx = this.formatHistoryBlock(history);
      answer = await this.callLLM(
        `You are Lumi, an educational AI tutor.${ctx}\n\nStudent: "${question}"\n\nAnswer helpfully and concisely.`,
      );
    } else {
      // ── No chunks found in the selected scope ──
      const scopeName = subunitTitle
        ? `"${subunitTitle}"`
        : unitTitle
        ? `"${unitTitle}"`
        : `this ${subject} textbook`;
      answer = `📭 I couldn't find information about **"${question}"** in ${scopeName}.\n\n` +
        `This topic may be covered in a different section. Try:\n` +
        `- Selecting a different unit or subunit\n` +
        `- Asking the question without a specific section selected\n` +
        `- Rephrasing your question with different keywords`;
    }

    // 8. Save assistant answer
    if (sessionId) {
      await this.addMessage(sessionId, 'assistant', answer, { grade, subject, sources });
    }

    // 9. Generate follow-up suggestions
    const suggestedQuestions = await this.generateSuggestions(answer, question, grade, subject);

    return { ok: true, answer, source: chunks.length > 0 ? 'rag' : 'general', suggestedQuestions };
  }

  /* ═══════════════════════════════════════════════════════════════
     QUESTION CLASSIFICATION
     ═══════════════════════════════════════════════════════════════ */

  private classifyQuestion(
    question: string,
    history: { role: string; content: string }[],
  ): 'greeting' | 'follow-up' | 'new' {
    const q = question.toLowerCase().trim();

    // Greeting
    const greetings = [
      'hey', 'hello', 'hi', 'greetings', 'sup', 'yo',
      'good morning', 'good afternoon', 'good evening', 'how are you',
    ];
    if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + ',') || q.startsWith(g + '!'))) {
      return 'greeting';
    }

    // Follow-up (only if there's prior conversation)
    if (history.length >= 2) {
      const patterns = [
        /^(give|provide|show)\s+(me\s+)?(an?\s+)?example/i,
        /^explain\s+(it\s+)?(more|simpler|again|better|clearly|further|in detail)/i,
        /^what\s+(do\s+you\s+mean|is\s+that|about)/i,
        /^tell\s+me\s+more/i,
        /^(more|further)\s+(details|info|information|explanation)/i,
        /^can\s+you\s+(elaborate|clarify|explain)/i,
        /^(how|why)\s+(exactly|specifically)/i,
        /^what\s+about/i,
        /^(and|but|also|so)\s+/i,
        /^(yes|no|ok|okay)[,.]?\s+(but|and|so|what|how|why|can)/i,
        /\b(you\s+said|you\s+mentioned|above|earlier|previous)\b/i,
      ];
      if (patterns.some(p => p.test(q))) return 'follow-up';

      // Very short + no explicit topic → probably follow-up
      if (q.split(/\s+/).length <= 4 && !q.includes('what is') && !q.includes('define')) {
        return 'follow-up';
      }
    }

    return 'new';
  }

  /* ═══════════════════════════════════════════════════════════════
     FOLLOW-UP RESOLUTION
     ═══════════════════════════════════════════════════════════════ */

  private async resolveFollowUp(
    question: string,
    history: { role: string; content: string }[],
    subject: string,
  ): Promise<string> {
    const recent = history
      .slice(-4)
      .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content.slice(0, 600)}`)
      .join('\n');

    const prompt =
      `Resolve this follow-up into a standalone question.\n\n` +
      `SUBJECT: ${subject}\n\nCONVERSATION:\n${recent}\n\n` +
      `FOLLOW-UP: "${question}"\n\n` +
      `Rewrite as a COMPLETE, STANDALONE question that includes the specific topic. Return ONLY the question.`;

    try {
      const result = await this.callLLM(prompt);
      return result.replace(/^["']|["']$/g, '').trim() || question;
    } catch {
      return question;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     CHUNK RETRIEVAL — Strict scoping (NO fallbacks)
     
     - Subunit selected → ALL chunks from that subunit only
     - Unit selected    → Semantic search within that unit only
     - Nothing selected → Semantic search across full book
     
     If the selected scope has no results, return empty.
     The caller will tell the student the answer isn't in that section.
     ═══════════════════════════════════════════════════════════════ */

  private async retrieveChunks(
    collectionName: string,
    question: string,
    subject: string,
    selectedUnit?: number,
    selectedSubunit?: string,
    unitTitle?: string,
    subunitTitle?: string,
  ): Promise<{ chunks: EnhancedChunkPayload[]; sources: { unitTitle: string; pageRange: string }[] }> {
    try {
      let chunks: EnhancedChunkPayload[] = [];
      const hasSubunit = !!(subunitTitle || selectedSubunit);
      const hasUnit = !!(selectedUnit !== undefined || unitTitle);

      if (hasSubunit) {
        // ── SUBUNIT SELECTED → scroll ALL chunks from that subunit ──
        chunks = await this.scrollSubunitChunks(
          collectionName, selectedUnit, selectedSubunit, unitTitle, subunitTitle,
        );
        this.logger.log(`📗 Subunit scope: ${chunks.length} chunks from "${subunitTitle || selectedSubunit}"`);

      } else if (hasUnit) {
        // ── UNIT SELECTED → semantic search within that unit only ──
        const vector = await this.llmService.embed(question);
        const unitFilter: any[] = [];
        if (selectedUnit !== undefined) {
          unitFilter.push({ key: 'unitNumber', match: { value: selectedUnit } });
        } else if (unitTitle) {
          unitFilter.push({ key: 'unitTitle', match: { text: unitTitle.trim() } });
        }
        const results = await this.qdrant.search(collectionName, {
          vector, limit: 15, filter: { must: unitFilter }, with_payload: true,
        });
        if (results && results.length > 0) {
          chunks = results.map(r => r.payload as unknown as EnhancedChunkPayload);
        }
        this.logger.log(`📘 Unit scope: ${chunks.length} chunks from unit ${selectedUnit ?? unitTitle}`);

      } else {
        // ── NOTHING SELECTED → semantic search across full book ──
        const vector = await this.llmService.embed(question);
        const results = await this.qdrant.search(collectionName, {
          vector, limit: 15, with_payload: true,
        });
        if (results && results.length > 0) {
          chunks = results.map(r => r.payload as unknown as EnhancedChunkPayload);
        }
        this.logger.log(`🌍 Full-book scope: ${chunks.length} chunks`);
      }

      // Remove garbage chunks
      chunks = chunks.filter(c => {
        const t = (c.text || '').trim();
        return t.length >= 50 && !/^\s*\d+\s*$/.test(t);
      });

      // For semantic searches (unit/book), keep top 10. For subunit scroll, keep all.
      if (!hasSubunit) {
        chunks = chunks.slice(0, 10);
      }

      this.logger.log(`✅ ${chunks.length} final chunks for: "${question.substring(0, 60)}"`);
      return { chunks, sources: this.retrievalService.extractSources(chunks) };
    } catch (err) {
      this.logger.error(`❌ Retrieval failed: ${err.message}`);
      return { chunks: [], sources: [] };
    }
  }

  /**
   * Scroll ALL chunks from a specific subunit.
   * Tries multiple matching strategies in order:
   *   1. subunitNumber exact match (most reliable if the data is consistent)
   *   2. subUnitTitle exact match
   *   3. subUnitTitle keyword/text match (handles slight differences)
   * Results are sorted by chunkIndex (reading order).
   */
  private async scrollSubunitChunks(
    collectionName: string,
    selectedUnit?: number,
    selectedSubunit?: string,
    unitTitle?: string,
    subunitTitle?: string,
  ): Promise<EnhancedChunkPayload[]> {
    // Build the unit-level filter
    const unitFilter: any[] = [];
    if (selectedUnit !== undefined) {
      unitFilter.push({ key: 'unitNumber', match: { value: selectedUnit } });
    } else if (unitTitle) {
      unitFilter.push({ key: 'unitTitle', match: { text: unitTitle.trim() } });
    }

    // Scroll ALL chunks from this unit (typically 30-80 chunks for a unit)
    const result = await this.qdrant.scroll(collectionName, {
      filter: unitFilter.length > 0 ? { must: unitFilter } : undefined,
      limit: 500, with_payload: true,
    });
    const allUnitChunks = (result.points || []).map((p: any) => p.payload as EnhancedChunkPayload);

    if (allUnitChunks.length === 0) {
      this.logger.warn(`⚠️ No chunks found for unit ${selectedUnit ?? unitTitle}`);
      return [];
    }

    // Filter by subunit using PREFIX matching on subunitNumber
    // e.g. selectedSubunit="1.5" matches "1.5", "1.5.1", "1.5.2"
    let matched: EnhancedChunkPayload[] = [];

    if (selectedSubunit) {
      const prefix = selectedSubunit;
      matched = allUnitChunks.filter(c => {
        if (!c.subunitNumber) return false;
        const num = c.subunitNumber.toString();
        return num === prefix || num.startsWith(prefix + '.');
      });
      if (matched.length > 0) {
        this.logger.log(`🎯 Subunit prefix match "${prefix}": ${matched.length} chunks`);
      }
    }

    // If subunitNumber didn't work, try subUnitTitle partial matching
    if (matched.length === 0 && subunitTitle) {
      const searchTitle = subunitTitle.trim().toLowerCase();
      matched = allUnitChunks.filter(c => {
        if (!c.subUnitTitle) return false;
        const stored = c.subUnitTitle.trim().toLowerCase();
        // Match if either contains the other (handles partial titles)
        return stored.includes(searchTitle) || searchTitle.includes(stored);
      });
      if (matched.length > 0) {
        this.logger.log(`🎯 Subunit title match "${subunitTitle}": ${matched.length} chunks`);
      }
    }

    if (matched.length === 0) {
      this.logger.warn(
        `⚠️ Subunit scroll found 0 matches (sub="${selectedSubunit}" title="${subunitTitle}") ` +
        `out of ${allUnitChunks.length} unit chunks`,
      );
      return [];
    }

    matched.sort((a, b) => a.chunkIndex - b.chunkIndex);
    return matched;
  }

  /* ═══════════════════════════════════════════════════════════════
     PROMPT BUILDING
     ═══════════════════════════════════════════════════════════════ */

  private buildPrompt(
    originalQuestion: string,
    searchQuery: string,
    chunks: EnhancedChunkPayload[],
    sources: { unitTitle: string; pageRange: string }[],
    bookName: string,
    history: { role: string; content: string }[],
    scopeUnit?: string,
    scopeSub?: string,
  ): string {
    // Format chunks with location labels
    const context = chunks
      .map((c, i) => {
        const loc = c.subUnitTitle
          ? `${c.unitTitle} › ${c.subUnitTitle}`
          : c.unitTitle || `Section ${c.unitNumber}`;
        return `[${i + 1}. ${loc}]\n${c.text}`;
      })
      .join('\n\n---\n\n');

    const historyBlock = this.formatHistoryBlock(history);

    const scope =
      scopeSub && scopeUnit ? `📍 Reading: ${scopeUnit} › ${scopeSub}\n`
      : scopeUnit ? `📍 Reading: ${scopeUnit}\n`
      : '';

    const interpreted =
      searchQuery !== originalQuestion ? `\n(Interpreted as: ${searchQuery})` : '';

    return (
      `You are Lumi, a thorough and friendly AI tutor for Ethiopian high school students.\n\n` +
      `📘 Book: "${bookName}"\n${scope}\n` +
      `${historyBlock}\n` +
      `TEXTBOOK CONTENT:\n---\n${context}\n---\n\n` +
      `STUDENT'S QUESTION: ${originalQuestion}${interpreted}\n\n` +
      `INSTRUCTIONS:\n` +
      `- Answer **ONLY** from the textbook content provided above. Do NOT use outside knowledge.\n` +
      `- Be **thorough** — cover every aspect of the question. Do NOT give a brief summary or stop early.\n` +
      `- ${history.length > 0 ? 'Connect your answer to the previous conversation if relevant.' : 'Focus on exactly what was asked.'}\n` +
      `- Use clear, simple language for a high school student.\n` +
      `- Format with markdown: ## headers, **bold** key terms, bullet points, numbered steps.\n` +
      `- If the textbook content above does not contain the answer, say: "This topic is not covered in this section."\n\n` +
      `Answer:`
    );
  }



  /* ═══════════════════════════════════════════════════════════════
     FOLLOW-UP SUGGESTIONS
     ═══════════════════════════════════════════════════════════════ */

  private async generateSuggestions(
    answer: string,
    question: string,
    grade: string,
    subject: string,
  ): Promise<string[]> {
    try {
      const res = await this.llmService.generate(
        `Based on this Q&A, suggest 3 short follow-up questions a ${grade} student might ask about ${subject}.\n` +
        `Question: "${question}"\nAnswer: "${answer.substring(0, 500)}"\n\n` +
        `Return ONLY a JSON array of 3 short questions (under 10 words). ` +
        `Example: ["Give me an example", "Why is this important?", "How does this relate to X?"]`,
        { temperature: 0.7, format: 'json' },
      );
      const text = res.text.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed.filter(i => typeof i === 'string').slice(0, 3) : [];
    } catch {
      return [];
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     UTILITIES
     ═══════════════════════════════════════════════════════════════ */

  private async loadHistory(sessionId?: string): Promise<{ role: string; content: string }[]> {
    if (!sessionId) return [];
    try {
      const session = await this.getSession(sessionId);
      if (!session?.messages?.length) return [];
      // Last 10 messages (5 exchanges) — full content, no truncation
      return session.messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    } catch {
      return [];
    }
  }

  private formatHistoryBlock(history: { role: string; content: string }[]): string {
    if (history.length === 0) return '';
    const lines = history
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'Student' : 'Lumi'}: ${m.content.slice(0, 1200)}`)
      .join('\n');
    return `\nCONVERSATION SO FAR:\n${lines}\n---\n`;
  }

  private collectionName(grade: string, subject: string): string {
    return `${grade}_${subject}`.replace(/\s+/g, '_').replace(/[^\w_]/g, '').toLowerCase();
  }

  private async callLLM(prompt: string): Promise<string> {
    const res = await this.llmService.generate(prompt);
    return res.text.trim();
  }
}
