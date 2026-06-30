import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsArray } from 'class-validator';

export class AddTimeDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Book ID' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty({ example: '10', description: 'Grade ID', required: false })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiProperty({ example: 'Math', description: 'Subject ID', required: false })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ example: 'Grade 9', description: 'Grade Title', required: false })
  @IsOptional()
  @IsString()
  gradeTitle?: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject Title', required: false })
  @IsOptional()
  @IsString()
  subjectTitle?: string;

  @ApiProperty({ example: 30, description: 'Minutes spent studying' })
  @IsNumber()
  @Min(0)
  minutes: number;
}

export class AddQuizResultDto {
  @ApiProperty() @IsString() @IsNotEmpty() bookId: string;
  @ApiProperty() @IsOptional() @IsString() gradeId?: string;
  @ApiProperty() @IsOptional() @IsString() subjectId?: string;
  @ApiProperty() @IsNumber() unitNumber: number;
  @ApiProperty() @IsNumber() score: number;
  @ApiProperty() @IsNumber() totalQuestions: number;
  @ApiProperty() @IsArray() answers: { questionIndex: number; correct: boolean }[];
}

export class DailyTimeDto {
  @ApiProperty({ example: '2024-01-15', description: 'Date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: 45, description: 'Minutes studied on this date' })
  minutes: number;
}

export class ProgressResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Progress record ID' })
  _id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Student ID' })
  studentId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Book ID' })
  bookId: string;

  @ApiProperty({ type: [DailyTimeDto], description: 'Daily study time records' })
  dailyTime: DailyTimeDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Last update timestamp' })
  lastUpdated: Date;
}

export class WeeklyProgressResponseDto {
  @ApiProperty({ type: [DailyTimeDto], description: 'Weekly study time breakdown' })
  weeklyProgress: DailyTimeDto[];

  @ApiProperty({ example: 180, description: 'Total minutes studied this week' })
  totalMinutes: number;
}
