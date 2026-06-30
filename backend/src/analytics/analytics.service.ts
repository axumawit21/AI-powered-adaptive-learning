import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Student } from '../students/student.schema';
import { Book } from '../books/book.schema';
import { Grade } from '../grades/grades.schema';
import { Subject } from '../subjects/subjects.schema';
import { Progress } from '../progress/progress.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel('Student') private studentModel: Model<Student>,
    @InjectModel('Book') private bookModel: Model<Book>,
    @InjectModel('Grade') private gradeModel: Model<any>,
    @InjectModel('Subject') private subjectModel: Model<any>,
    @InjectModel('Progress') private progressModel: Model<Progress>,
  ) {}

  async getDashboardStats() {
    const [totalStudents, totalBooks, totalGrades, totalSubjects] = await Promise.all([
      this.studentModel.countDocuments(),
      this.bookModel.countDocuments(),
      this.gradeModel.countDocuments(),
      this.subjectModel.countDocuments(),
    ]);

    // Get recent activity - students registered in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentStudents = await this.studentModel.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    // Get total progress entries
    const totalProgress = await this.progressModel.countDocuments();

    // Get books by grade with grade titles
    const booksByGradeRaw = await this.bookModel.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Lookup grade titles
    const gradeIds = booksByGradeRaw.map(item => item._id);
    const grades = await this.gradeModel.find({ _id: { $in: gradeIds } });
    const gradeMap = new Map(grades.map(g => [g._id.toString(), g.title]));

    const booksByGrade = booksByGradeRaw.map(item => ({
      _id: item._id,
      gradeTitle: gradeMap.get(item._id.toString()) || item._id,
      count: item.count
    }));

    return {
      totalStudents,
      totalBooks,
      totalGrades,
      totalSubjects,
      recentStudents,
      totalProgress,
      booksByGrade
    };
  }
}
