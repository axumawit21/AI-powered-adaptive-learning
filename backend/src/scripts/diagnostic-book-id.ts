import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QuestionBankService } from '../question-bank/question-bank.service';
import { Types } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const qbService = app.get(QuestionBankService);

  // Use the ID being emitted by the frontend now (the Book ID)
  const studentId = "69328ece5d17b9e3eacd3d46"; 
  const bookIdAsSubjectId = "6932e85667eb0ae78befc8b7"; 
  const gradeId = "6932d444c809fa0ba44756df"; 

  console.log("AV_START_WITH_BOOK_ID");
  try {
    const availability = await qbService.checkAvailableQuestions({
      studentId,
      subjectId: bookIdAsSubjectId,
      gradeId,
    });
    console.log(JSON.stringify(availability));
  } catch (err) {
    console.error("Error with Book ID:", err.message);
  }
  console.log("AV_END");

  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
