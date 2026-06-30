import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TtsService } from './tts.service';
import { TtsController } from './tts.controller';
import { Summary, SummarySchema } from '../summary/schemas/summary.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Summary.name, schema: SummarySchema },
    ]),
  ],
  controllers: [TtsController],
  providers: [TtsService],
  exports: [TtsService],
})
export class TtsModule {}
