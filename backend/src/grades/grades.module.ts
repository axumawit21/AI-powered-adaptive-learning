import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { Grade, GradeSchema } from './grades.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Grade.name, schema: GradeSchema }]),
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService, MongooseModule], // important if another module (Books) uses it
})
export class GradesModule {}
