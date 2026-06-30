import { Injectable, Logger, Inject } from '@nestjs/common';
import { REDIS } from '../redis.provider';
import type Redis from 'ioredis';

/**
 * Redis Caching Service
 * Provides a structured caching strategy for the application
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  // Default TTLs in seconds
  private readonly TTL = {
    SHORT: 60 * 5,          // 5 minutes - for frequently changing data
    MEDIUM: 60 * 30,        // 30 minutes - for semi-static data
    LONG: 60 * 60 * 24,     // 24 hours - for static data
    SUMMARY: 60 * 60 * 6,   // 6 hours - for AI-generated summaries
    QUIZ: 60 * 60 * 2,      // 2 hours - for generated quizzes
    EMBEDDING: 60 * 60 * 24 * 7, // 7 days - for embeddings
  };

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.setex(key, this.TTL.MEDIUM, serialized);
      }
    } catch (error) {
      this.logger.warn(`Cache set error for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.warn(`Cache delete error for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.warn(`Cache delete pattern error: ${error.message}`);
    }
  }

  // ===== Domain-specific caching methods =====

  /**
   * Cache key generators for consistent naming
   */
  keys = {
    summary: (grade: string, subject: string, unit: string) => 
      `summary:${grade}:${subject}:${unit}`,
    quiz: (grade: string, subject: string, unit: string) => 
      `quiz:${grade}:${subject}:${unit}`,
    chatAnswer: (question: string, grade: string, subject: string) => 
      `chat:${grade}:${subject}:${this.hashQuestion(question)}`,
    embedding: (text: string) => 
      `embed:${this.hashQuestion(text)}`,
    studentProgress: (studentId: string) => 
      `progress:${studentId}`,
    bookStructure: (bookId: string) => 
      `book:${bookId}:structure`,
  };

  /**
   * Get cached summary
   */
  async getSummary(grade: string, subject: string, unit: string) {
    return this.get<any>(this.keys.summary(grade, subject, unit));
  }

  /**
   * Cache a summary
   */
  async setSummary(grade: string, subject: string, unit: string, summary: any) {
    return this.set(this.keys.summary(grade, subject, unit), summary, this.TTL.SUMMARY);
  }

  /**
   * Get cached chat answer
   */
  async getChatAnswer(question: string, grade: string, subject: string) {
    return this.get<any>(this.keys.chatAnswer(question, grade, subject));
  }

  /**
   * Cache a chat answer
   */
  async setChatAnswer(question: string, grade: string, subject: string, answer: any) {
    return this.set(this.keys.chatAnswer(question, grade, subject), answer, this.TTL.LONG);
  }

  /**
   * Simple hash function for cache keys
   */
  private hashQuestion(text: string): string {
    let hash = 0;
    const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
