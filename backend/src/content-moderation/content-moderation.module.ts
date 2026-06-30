import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentModerationController } from './content-moderation.controller';
import { ContentModerationService } from './content-moderation.service';
import { Question, QuestionSchema } from '../question-bank/schemas/question.schema';
import { Summary, SummarySchema } from '../summary/schemas/summary.schema';
import { Presentation, PresentationSchema } from '../presentation/schemas/presentation.schema';
import { Quiz, QuizSchema } from '../quiz/quiz.schema';
import { ModelExam, ModelExamSchema } from '../national-exam/schemas/model-exam.schema';
import { TeacherUser, TeacherUserSchema } from '../teacher/teacher-user.schema';
import { Grade, GradeSchema } from '../grades/grades.schema';
import { Subject, SubjectSchema } from '../subjects/subjects.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Summary.name, schema: SummarySchema },
      { name: Presentation.name, schema: PresentationSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: ModelExam.name, schema: ModelExamSchema },
      { name: TeacherUser.name, schema: TeacherUserSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
  ],
  controllers: [ContentModerationController],
  providers: [ContentModerationService],
  exports: [ContentModerationService],
})
export class ContentModerationModule {}

