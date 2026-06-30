
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from '../question-bank/schemas/question.schema';
import { Summary } from '../summary/schemas/summary.schema';
import { Presentation } from '../presentation/schemas/presentation.schema';
import { Quiz } from '../quiz/quiz.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const questionModel = app.get<Model<Question>>(getModelToken(Question.name));
  const summaryModel = app.get<Model<Summary>>(getModelToken(Summary.name));
  const presentationModel = app.get<Model<Presentation>>(getModelToken(Presentation.name));
  const quizModel = app.get<Model<Quiz>>(getModelToken(Quiz.name));

  console.log('🧹 Starting cleanup of REJECTED content...');
  
  // Delete suspended (rejected) items
  const qResult = await questionModel.deleteMany({ status: 'suspended' });
  const sResult = await summaryModel.deleteMany({ status: 'suspended' });
  const pResult = await presentationModel.deleteMany({ status: 'suspended' });
  const zResult = await quizModel.deleteMany({ status: 'suspended' });

  console.log(`✅ Deleted ${qResult.deletedCount} rejected questions.`);
  console.log(`✅ Deleted ${sResult.deletedCount} rejected summaries.`);
  console.log(`✅ Deleted ${pResult.deletedCount} rejected presentations.`);
  console.log(`✅ Deleted ${zResult.deletedCount} rejected quizzes.`);

  console.log('✨ Cleanup complete.');
  await app.close();
  process.exit(0);
}

bootstrap();
