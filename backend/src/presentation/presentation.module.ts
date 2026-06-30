import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { LlmModule } from '../llm/llm.module';
import { qdrantProvider } from '../common/qdrant.provider';
import { GradesModule } from '../grades/grades.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { Subject, SubjectSchema } from '../subjects/subjects.schema';
import { Presentation, PresentationSchema } from './schemas/presentation.schema';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    LlmModule,
    GradesModule,
    SubjectsModule,
    RagModule,
    MongooseModule.forFeature([
      { name: Grade.name, schema: GradeSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Presentation.name, schema: PresentationSchema },
    ]),
  ],
  controllers: [PresentationController],
  providers: [PresentationService, qdrantProvider],
  exports: [PresentationService],
})
export class PresentationModule {}

