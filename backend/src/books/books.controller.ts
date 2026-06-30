import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  Res,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { BooksService } from './books.service';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { Grade, GradeDocument } from '../grades/grades.schema';
import { Subject, SubjectDocument } from '../subjects/subjects.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  UploadBookDto, 
  UpdateStructureDto, 
  UpdateBookStructureDto, 
  BookUploadResponseDto, 
  BookResponseDto 
} from './dto/books.dto';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    @InjectModel(Grade.name) private gradeModel: Model<GradeDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
  ) {}

  /** ---------------- Upload Book File ---------------- */
  @Post('upload')
  @ApiOperation({ summary: 'Upload a book', description: 'Upload a PDF book file with grade and subject' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF file to upload' },
        grade: { type: 'string', description: 'Grade ObjectId' },
        subject: { type: 'string', description: 'Subject ObjectId' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Book uploaded successfully', type: BookUploadResponseDto })
  @ApiResponse({ status: 400, description: 'No file uploaded or invalid grade/subject' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: UploadBookDto) {
    try {
      if (!file) return { message: '❌ No file uploaded' };

      const fileUrl = `http://localhost:3000/books/${file.filename}`;

      // Validate Grade
      const gradeDoc = await this.gradeModel.findById(body.grade);
      if (!gradeDoc) return { message: '❌ Grade not found' };

      // Validate Subject
      const subjectDoc = await this.subjectModel.findById(body.subject);
      if (!subjectDoc) return { message: '❌ Subject not found' };

      const savedBook = await this.booksService.create({
        title: subjectDoc.title, // Use subject name as book title
        filePath: file.path,
        fileUrl,
        grade: gradeDoc._id,
        subject: subjectDoc._id,
        uploadedBy: 'admin',
        units: [],
      });

      return { message: '✅ File uploaded successfully!', book: savedBook };
    } catch (error) {
      console.error('❌ Upload error:', error);
      return { message: '❌ Error uploading file', error: error.message || 'Unknown error' };
    }
  }

  /** ---------------- Serve Book PDF ---------------- */
  @Get(':filename')
  @ApiOperation({ summary: 'Get book PDF', description: 'Download/view a book PDF by filename' })
  @ApiParam({ name: 'filename', description: 'PDF filename' })
  @ApiResponse({ status: 200, description: 'PDF file returned' })
  @ApiResponse({ status: 404, description: 'File not found' })
  getBook(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    res.setHeader('Content-Type', 'application/pdf');
    return res.sendFile(filePath);
  }

  /** ---------------- Get Book Details by ID ---------------- */
  @Get('details/:id')
  @ApiOperation({ summary: 'Get book details', description: 'Get details of a book by its ID including units' })
  @ApiParam({ name: 'id', description: 'Book MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Book details returned' })
  async getBookById(@Param('id') id: string) {
    return this.booksService.findById(id);
  }

  /** ---------------- Get subjects in a grade ---------------- */
  @Get('structure/:grade')
  @ApiOperation({ summary: 'Get subjects by grade', description: 'Get all subjects available for a specific grade' })
  @ApiParam({ name: 'grade', description: 'Grade ObjectId' })
  @ApiResponse({ status: 200, description: 'List of subjects for the grade' })
  async getSubjectsByGrade(@Param('grade') grade: string) {
    const books = await this.booksService.findByGrade(grade);

    const subjects = books.map(b => {
      const subject = b.subject as SubjectDocument;
      return {
        id: subject._id,
        name: subject.title,
        bookTitle: b.title,
      };
    });

    return { subjects };
  }

  /** ---------------- Get full structure of grade + subject ---------------- */
  @Get('structure/:grade/:subject')
  @ApiOperation({ summary: 'Get book structure', description: 'Get the full structure (units/chapters) for a grade and subject' })
  @ApiParam({ name: 'grade', description: 'Grade ObjectId' })
  @ApiParam({ name: 'subject', description: 'Subject ObjectId' })
  @ApiResponse({ status: 200, description: 'Book structure with units' })
  async getGradeSubject(@Param('grade') grade: string, @Param('subject') subject: string) {
    const book = await this.booksService.findByGradeAndSubject(grade, subject);
    if (!book) return { subject: null };

    return {
      subject: {
        bookId: book._id,
        name: book.title,
        grade: book.grade,
        subject: book.subject,
        units: book.units || [],
      },
    };
  }

  /** ---------------- Get all books ---------------- */
  @Get()
  @ApiOperation({ summary: 'Get all books', description: 'Returns a list of all books' })
  @ApiResponse({ status: 200, description: 'List of books', type: [BookResponseDto] })
  async getAllBooks() {
    return await this.booksService.findAll();
  }

  /** ---------------- Update units (structure) ---------------- */
  @Post('structure/update')
  @ApiOperation({ summary: 'Update book structure', description: 'Update the units/chapters structure for a book by grade and subject' })
  @ApiBody({ type: UpdateStructureDto })
  @ApiResponse({ status: 200, description: 'Structure updated successfully' })
  async updateStructure(@Body() body: UpdateStructureDto) {
    const updated = await this.booksService.updateBookStructureByGradeAndSubject(
      body.grade,
      body.subject,
      body.units,
    );

    return { message: '✅ Structure updated successfully', book: updated };
  }

  /** ---------------- Update book structure by ID ---------------- */
  @Put(':id/structure')
  @ApiOperation({ summary: 'Update book structure by ID', description: 'Update the units/chapters structure for a book by its ID' })
  @ApiParam({ name: 'id', description: 'Book MongoDB ID' })
  @ApiBody({ type: UpdateBookStructureDto })
  @ApiResponse({ status: 200, description: 'Structure updated successfully' })
  async updateBookStructure(
    @Param('id') id: string,
    @Body() body: UpdateBookStructureDto,
  ) {
    const updated = await this.booksService.updateBookStructureById(id, body.units);
    return { message: '✅ Structure updated successfully', book: updated };
  }

  /** ---------------- Delete a book ---------------- */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book', description: 'Delete a book by its ID' })
  @ApiParam({ name: 'id', description: 'Book MongoDB ID' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async deleteBook(@Param('id') id: string) {
    return this.booksService.delete(id);
  }
}
