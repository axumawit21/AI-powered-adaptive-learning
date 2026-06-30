import { Controller, Get, Inject } from '@nestjs/common';
import { QDRANT } from './common/qdrant.provider';
import type { QdrantClient } from '@qdrant/js-client-rest';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    @Inject(QDRANT) private readonly qdrant: QdrantClient,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Lightweight health check', description: 'Quick health check for load balancers — no external calls' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  healthCheck() {
    const mongoState = this.mongoConnection.readyState;
    return {
      status: mongoState === 1 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('health/deep')
  @ApiOperation({ summary: 'Deep health check', description: 'Full connectivity check for MongoDB and Qdrant' })
  @ApiResponse({ status: 200, description: 'Detailed service health status' })
  async deepHealthCheck() {
    const mongoState = this.mongoConnection.readyState;
    const mongoStatus = mongoState === 1 ? 'connected' : mongoState === 2 ? 'connecting' : 'disconnected';
    
    let qdrantStatus = 'unknown';
    try {
      await this.qdrant.getCollections();
      qdrantStatus = 'connected';
    } catch {
      qdrantStatus = 'disconnected';
    }

    const allHealthy = mongoStatus === 'connected' && qdrantStatus === 'connected';

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: mongoStatus,
        qdrant: qdrantStatus,
      },
    };
  }
}