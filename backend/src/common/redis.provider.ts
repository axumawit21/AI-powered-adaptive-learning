// src/common/redis.provider.ts
import { Provider, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS,
  useFactory: () => {
    const logger = new Logger('RedisProvider');
    
    // Support REDIS_URL (cloud Redis) or fallback to host/port (local)
    const redisUrl = process.env.REDIS_URL;
    
    let client: Redis;
    if (redisUrl) {
      // Cloud Redis (Render, Upstash, Railway, etc.)
      client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 5) return null; // Stop retrying after 5 attempts
          return Math.min(times * 500, 3000);
        },
        // TLS is auto-detected from rediss:// URLs by ioredis
      });
      logger.log('🔗 Redis connecting via REDIS_URL');
    } else {
      // Local Redis
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT || 6379);
      client = new Redis({ host, port,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 500, 2000);
        },
      });
      logger.log(`🔗 Redis connecting to ${host}:${port}`);
    }

    client.on('connect', () => logger.log('✅ Redis connected'));
    client.on('error', (err) => logger.error('❌ Redis error: ' + err.message));
    
    return client;
  },
};

