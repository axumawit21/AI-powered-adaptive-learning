import { Injectable, Logger } from '@nestjs/common';

interface SessionChunk {
  id: string;
  text: string;
  source: string; // filename
  pageNumber?: number;
  chunkIndex: number;
}

interface StudentSession {
  studentId: string;
  chunks: SessionChunk[];
  files: { name: string; type: string; uploadedAt: Date }[];
  createdAt: Date;
  lastAccessedAt: Date;
}

@Injectable()
export class SessionStoreService {
  private readonly logger = new Logger(SessionStoreService.name);
  private readonly sessions = new Map<string, StudentSession>();
  private readonly SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

  constructor() {
    // Auto-cleanup expired sessions every 15 minutes
    setInterval(() => this.cleanupExpiredSessions(), 15 * 60 * 1000);
  }

  /**
   * Get or create a session for a student
   */
  getSession(studentId: string): StudentSession {
    if (!this.sessions.has(studentId)) {
      this.sessions.set(studentId, {
        studentId,
        chunks: [],
        files: [],
        createdAt: new Date(),
        lastAccessedAt: new Date(),
      });
      this.logger.log(`Created new session for student: ${studentId}`);
    }
    
    const session = this.sessions.get(studentId)!;
    session.lastAccessedAt = new Date();
    return session;
  }

  /**
   * Add chunks to a student's session
   */
  addChunks(studentId: string, chunks: SessionChunk[], fileName: string, fileType: string): void {
    const session = this.getSession(studentId);
    session.chunks.push(...chunks);
    session.files.push({ name: fileName, type: fileType, uploadedAt: new Date() });
    this.logger.log(`Added ${chunks.length} chunks for student ${studentId} from ${fileName}`);
  }

  /**
   * Get all chunks for a student
   */
  getChunks(studentId: string): SessionChunk[] {
    const session = this.sessions.get(studentId);
    if (!session) return [];
    session.lastAccessedAt = new Date();
    return session.chunks;
  }

  /**
   * Check if student has any uploaded content
   */
  hasContent(studentId: string): boolean {
    return this.sessions.has(studentId) && this.sessions.get(studentId)!.chunks.length > 0;
  }

  /**
   * Get session info for a student
   */
  getSessionInfo(studentId: string): { fileCount: number; chunkCount: number; files: string[] } | null {
    const session = this.sessions.get(studentId);
    if (!session) return null;
    return {
      fileCount: session.files.length,
      chunkCount: session.chunks.length,
      files: session.files.map(f => f.name),
    };
  }

  /**
   * Clear a student's session
   */
  clearSession(studentId: string): void {
    this.sessions.delete(studentId);
    this.logger.log(`Cleared session for student: ${studentId}`);
  }

  /**
   * Remove expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [studentId, session] of this.sessions.entries()) {
      if (now - session.lastAccessedAt.getTime() > this.SESSION_TTL_MS) {
        this.sessions.delete(studentId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired sessions`);
    }
  }
}
