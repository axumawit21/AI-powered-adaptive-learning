import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import {
  NationalExamPattern,
  NationalExamPatternSchema,
} from './schemas/national-exam-pattern.schema';
import { ModelExam, ModelExamSchema } from './schemas/model-exam.schema';
import {
  ModelExamQuestion,
  ModelExamQuestionSchema,
} from './schemas/model-exam-question.schema';

// Services
import { PatternAnalysisService } from './services/pattern-analysis.service';
import { BlueprintService } from './services/blueprint.service';
import { QuestionGeneratorService } from './services/question-generator.service';
import { ModelExamService } from './services/model-exam.service';

// Controllers
import {
  ModelExamAdminController,
  ModelExamStudentController,
} from './model-exam.controller';

// External modules
import { ExamPaperModule } from '../exam-paper/exam-paper.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { GradesModule } from '../grades/grades.module';
import { LlmModule } from '../llm/llm.module';
import { RagModule } from '../rag/rag.module';

// External schemas (for injection)
import { ExamPaper, ExamPaperSchema } from '../exam-paper/schemas/exam-paper.schema';
import {
  ExamPaperQuestion,
  ExamPaperQuestionSchema,
} from '../exam-paper/schemas/exam-paper-question.schema';
import { Subject, SubjectSchema } from '../subjects/subjects.schema';
import { Grade, GradeSchema } from '../grades/grades.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NationalExamPattern.name, schema: NationalExamPatternSchema },
      { name: ModelExam.name, schema: ModelExamSchema },
      { name: ModelExamQuestion.name, schema: ModelExamQuestionSchema },
      { name: ExamPaper.name, schema: ExamPaperSchema },
      { name: ExamPaperQuestion.name, schema: ExamPaperQuestionSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Grade.name, schema: GradeSchema },
    ]),
    LlmModule,
    RagModule,
  ],
  controllers: [ModelExamAdminController, ModelExamStudentController],
  providers: [
    PatternAnalysisService,
    BlueprintService,
    QuestionGeneratorService,
    ModelExamService,
  ],
  exports: [ModelExamService],
})
export class NationalExamModule {}
