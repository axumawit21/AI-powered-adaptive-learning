import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './book.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class BooksService {
  constructor(@InjectModel(Book.name) private bookModel: Model<BookDocument>) {}

  /** ---------------- Create / Upload ---------------- */
  async create(data: any): Promise<BookDocument> {
    const book = new this.bookModel(data);
    return book.save();
  }

  /** ---------------- Find by ID ---------------- */
  async findById(id: string): Promise<BookDocument> {
    return this.bookModel.findById(id).populate('grade').populate('subject').exec() as unknown as Promise<BookDocument>;
  }

  /** ---------------- Get all books ---------------- */
  async findAll(): Promise<BookDocument[]> {
    return this.bookModel.find().populate('grade').populate('subject').exec() as unknown as Promise<BookDocument[]>;
  }

  /** ---------------- Find by grade ---------------- */
  async findByGrade(gradeId: string): Promise<BookDocument[]> {
    return this.bookModel
      .find({ grade: new Types.ObjectId(gradeId) })
      .populate('grade')
      .populate('subject')
      .exec() as unknown as Promise<BookDocument[]>;
  }

  /** ---------------- Find by grade + subject ---------------- */
  async findByGradeAndSubject(gradeId: string, subjectId: string): Promise<BookDocument | null> {
    return this.bookModel
      .findOne({
        grade: new Types.ObjectId(gradeId),
        subject: new Types.ObjectId(subjectId),
      })
      .populate('grade')
      .populate('subject')
      .exec() as unknown as Promise<BookDocument | null>;
  }

  /** ---------------- Update Units (Structure) ---------------- */
  async updateBookStructureByGradeAndSubject(
    gradeId: string,
    subjectId: string,
    units: any[],
  ): Promise<BookDocument> {
    const book = await this.bookModel.findOne({
      grade: new Types.ObjectId(gradeId),
      subject: new Types.ObjectId(subjectId),
    });

    if (!book) {
      throw new Error(`Book not found: ${gradeId} - ${subjectId}`);
    }

    book.units = units;
    return book.save();
  }

  /** ---------------- Update Units by Book ID ---------------- */
  async updateBookStructureById(bookId: string, units: any[]): Promise<BookDocument> {
    const book = await this.bookModel.findById(bookId);
    if (!book) {
      throw new Error(`Book not found: ${bookId}`);
    }

    book.units = units;
    return book.save();
  }

  /** ---------------- Delete a Book ---------------- */
  async delete(bookId: string): Promise<BookDocument> {
    const book = await this.bookModel.findByIdAndDelete(bookId);
    if (!book) {
      throw new Error(`Book not found: ${bookId}`);
    }
    return book;
  }
}
