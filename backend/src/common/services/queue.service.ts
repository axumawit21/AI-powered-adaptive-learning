import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Bull, { Queue, Job } from 'bull';

/**
 * Job types for the background processor
 */
export enum JobType {
  GENERATE_SUMMARY = 'generate-summary',
  GENERATE_QUIZ = 'generate-quiz',
  PROCESS_PDF = 'process-pdf',
  GENERATE_EMBEDDING = 'generate-embedding',
  SEND_NOTIFICATION = 'send-notification',
  CLEANUP_OLD_DATA = 'cleanup-old-data',
}

/**
 * Job payload interfaces
 */
export interface SummaryJobPayload {
  gradeId: string;
  subjectId: string;
  unitIdentifier: string;
  gradeTitle: string;
  subjectTitle: string;
}

export interface QuizJobPayload {
  gradeId: string;
  subjectId: string;
  unit: string;
  numQuestions: number;
}

export interface PdfJobPayload {
  filePath: string;
  bookId: string;
}

/**
 * Background Job Queue Service
 * Handles heavy processing tasks asynchronously using Bull
 */
@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, Queue> = new Map();

  async onModuleInit() {
    // Support REDIS_URL (cloud) or host/port (local)
    const redisUrl = process.env.REDIS_URL;
    const redisConfig = redisUrl
      ? redisUrl
      : {
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT || 6379),
        };

    // Create queues for different job types
    const queueNames = [
      'summary-generation',
      'quiz-generation', 
      'pdf-processing',
      'embedding-generation',
      'notifications',
      'maintenance',
    ];

    for (const name of queueNames) {
      const queue = new Bull(name, { redis: redisConfig });
      this.queues.set(name, queue);
      
      // Add event listeners
      queue.on('completed', (job: Job) => {
        this.logger.log(`Job ${job.id} in ${name} completed`);
      });

      queue.on('failed', (job: Job, error: Error) => {
        this.logger.error(`Job ${job.id} in ${name} failed: ${error.message}`);
      });
    }

    this.logger.log(`📋 Bull queues initialized: ${queueNames.join(', ')}`);
  }

  /**
   * Add a job to generate a summary in the background
   */
  async addSummaryJob(payload: SummaryJobPayload): Promise<Job> {
    const queue = this.queues.get('summary-generation');
    if (!queue) throw new Error('Summary queue not initialized');
    
    return queue.add(JobType.GENERATE_SUMMARY, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50,      // Keep last 50 failed jobs
    });
  }

  /**
   * Add a job to generate a quiz in the background
   */
  async addQuizJob(payload: QuizJobPayload): Promise<Job> {
    const queue = this.queues.get('quiz-generation');
    if (!queue) throw new Error('Quiz queue not initialized');
    
    return queue.add(JobType.GENERATE_QUIZ, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  }

  /**
   * Add a job to process a PDF in the background
   */
  async addPdfJob(payload: PdfJobPayload): Promise<Job> {
    const queue = this.queues.get('pdf-processing');
    if (!queue) throw new Error('PDF queue not initialized');
    
    return queue.add(JobType.PROCESS_PDF, payload, {
      attempts: 2,
      backoff: { type: 'fixed', delay: 10000 },
      timeout: 5 * 60 * 1000, // 5 minute timeout for PDFs
      removeOnComplete: 50,
      removeOnFail: 20,
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    const stats: Record<string, any> = {};
    for (const [name] of this.queues) {
      stats[name] = await this.getQueueStats(name);
    }
    return stats;
  }

  /**
   * Clean old jobs from queues
   */
  async cleanOldJobs(gracePeriodMs: number = 24 * 60 * 60 * 1000) {
    for (const [name, queue] of this.queues) {
      await queue.clean(gracePeriodMs, 'completed');
      await queue.clean(gracePeriodMs, 'failed');
      this.logger.log(`Cleaned old jobs from queue: ${name}`);
    }
  }
}
