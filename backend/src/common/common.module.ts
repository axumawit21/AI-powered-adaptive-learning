import { Module, Global } from '@nestjs/common';
import { redisProvider, REDIS } from './redis.provider';
import { qdrantProvider, QDRANT } from './qdrant.provider';
import { CacheService } from './services/cache.service';
import { QueueService } from './services/queue.service';

/**
 * Common Module
 * Contains shared providers and services used across the application
 */
@Global()
@Module({
  providers: [
    redisProvider,
    qdrantProvider,
    CacheService,
    QueueService,
  ],
  exports: [
    REDIS,
    QDRANT,
    CacheService,
    QueueService,
  ],
})
export class CommonModule {}
