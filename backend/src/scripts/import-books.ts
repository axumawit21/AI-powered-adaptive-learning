
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { BooksService } from '../books/books.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import { Book } from '../books/book.schema';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const gradeModel = app.get<Model<Grade>>(getModelToken(Grade.name));
  const subjectModel = app.get<Model<Subject>>(getModelToken(Subject.name));
  const bookModel = app.get<Model<Book>>(getModelToken(Book.name));

  const baseDir = path.join(__dirname, '../books/book-structures');
  
  // Recursive function to find all json files
  function getJsonFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getJsonFiles(filePath));
      } else if (file.endsWith('.json')) {
        results.push(filePath);
      }
    });
    return results;
  }

  const files = getJsonFiles(baseDir);
  console.log(`Found ${files.length} JSON files to process.`);

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!data.grade || !data.name) {
        console.warn(`Skipping ${filePath}: Missing grade or name.`);
        continue;
      }

      console.log(`Processing ${data.name} for ${data.grade}...`);

      // 1. Find or Create Grade
      let gradeDoc = await gradeModel.findOne({ title: data.grade });
      if (!gradeDoc) {
        // Extract number if possible, e.g. "Grade 9" -> 9
        const match = data.grade.match(/\d+/);
        const gradeNum = match ? parseInt(match[0]) : 0;
        gradeDoc = await gradeModel.create({ title: data.grade, gradeNumber: gradeNum });
        console.log(`  Created Grade: ${data.grade}`);
      }

      // 2. Find or Create Subject
      let subjectDoc = await subjectModel.findOne({ title: data.name });
      if (!subjectDoc) {
        subjectDoc = await subjectModel.create({ title: data.name });
        console.log(`  Created Subject: ${data.name}`);
      }

      // 3. Find or Create Book
      let bookDoc = await bookModel.findOne({ 
        grade: gradeDoc._id, 
        subject: subjectDoc._id 
      });

      if (!bookDoc) {
        bookDoc = new bookModel({
          title: `${data.name} ${data.grade}`,
          grade: gradeDoc._id,
          subject: subjectDoc._id,
          units: data.units || []
        });
        console.log(`  Created Book: ${bookDoc.title}`);
      } else {
        bookDoc.units = data.units || [];
        console.log(`  Updated Book: ${bookDoc.title}`);
      }

      await bookDoc.save();

    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  console.log('Import completed.');
  await app.close();
}

bootstrap();
