import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { redisProvider } from '../common/redis.provider';
import { qdrantProvider } from '../common/qdrant.provider';
import { ChatSession, ChatSessionSchema } from './schemas/chat-session.schema';

import { LlmModule } from '../llm/llm.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ChatSession.name, schema: ChatSessionSchema }]),
    LlmModule,
    RagModule, // Enhanced RAG with sliding window
  ],
  controllers: [ChatController],
  providers: [ChatService, redisProvider, qdrantProvider],
  exports: [ChatService], // Export for StudentUploadModule
})
export class ChatModule {}