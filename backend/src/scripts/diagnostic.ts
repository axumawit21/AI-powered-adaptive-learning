import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QuestionBankService } from '../question-bank/question-bank.service';
import { EnhancedExamService } from '../exam/enhanced-exam.service';
import { Types } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const qbService = app.get(QuestionBankService);
  const examService = app.get(EnhancedExamService);

  const studentId = "69328ece5d17b9e3eacd3d46"; // From my check-attempts.js output
  const subjectId = "6932e7f267eb0ae78befc8b7"; // Biology ID
  const gradeId = "6932d444c809fa0ba44756df"; // Grade 9 ID

  console.log("\n--- Testing checkAvailableQuestions ---");
  const availability = await qbService.checkAvailableQuestions({
    studentId,
    subjectId,
    gradeId,
  });
  console.log("Availability Result:", JSON.stringify(availability, null, 2));

  console.log("\n--- Testing generateExam ---");
  try {
    const exam = await examService.generateExam({
      studentId,
      subjectId,
      gradeId,
      type: 'subject',
      questionCount: 20
    });
    console.log("Exam Generated:", exam.examId, "Questions:", exam.questions.length);
  } catch (err) {
    console.error("Exam Generation Failed:", err.message);
  }

  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
