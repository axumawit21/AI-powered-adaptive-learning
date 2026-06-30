import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadBookDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Grade ObjectId' })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Subject ObjectId' })
  @IsString()
  @IsNotEmpty()
  subject: string;
}

export class SubChapterDto {
  @ApiProperty({ example: 'sub-1-1', description: 'SubChapter ID' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: '1.1', description: 'Subunit number' })
  @IsString()
  @IsOptional()
  subunitNumber?: string;

  @ApiProperty({ example: 'Cell Structure', description: 'SubChapter title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 5, description: 'Start page' })
  @IsNumber()
  @IsOptional()
  pageStart?: number;

  @ApiProperty({ example: 10, description: 'End page' })
  @IsNumber()
  @IsOptional()
  pageEnd?: number;

  @ApiPropertyOptional({ type: [SubChapterDto], description: 'Nested sub-chapters' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubChapterDto)
  @IsOptional()
  subChapters?: SubChapterDto[];
}

export class UnitDto {
  @ApiProperty({ example: 'unit-1', description: 'Unit ID' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 1, description: 'Unit number' })
  @IsNumber()
  @IsOptional()
  unitNumber?: number;

  @ApiProperty({ example: 'Unit 1: Algebra Basics', description: 'Unit title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 1, description: 'Start page' })
  @IsNumber()
  @IsOptional()
  pageStart?: number;

  @ApiProperty({ example: 30, description: 'End page' })
  @IsNumber()
  @IsOptional()
  pageEnd?: number;

  @ApiPropertyOptional({ type: [SubChapterDto], description: 'SubChapters in this unit' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubChapterDto)
  @IsOptional()
  subChapters?: SubChapterDto[];

  @ApiPropertyOptional({ type: [SubChapterDto], description: 'Chapters in this unit (alias for subChapters)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubChapterDto)
  @IsOptional()
  chapters?: SubChapterDto[];
}

export class UpdateStructureDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Grade ObjectId' })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Subject ObjectId' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ type: [UnitDto], description: 'Array of units with chapters' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitDto)
  units: UnitDto[];
}

export class UpdateBookStructureDto {
  @ApiProperty({ type: [UnitDto], description: 'Array of units with chapters' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitDto)
  units: UnitDto[];
}

export class BookUploadResponseDto {
  @ApiProperty({ example: '✅ File uploaded successfully!', description: 'Status message' })
  message: string;

  @ApiPropertyOptional({ description: 'Uploaded book data' })
  book?: any;
}

export class BookResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Book ID' })
  _id: string;

  @ApiProperty({ example: 'Mathematics Grade 10', description: 'Book title' })
  title: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Grade reference' })
  grade: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Subject reference' })
  subject: string;

  @ApiPropertyOptional({ example: './uploads/book.pdf', description: 'Local file path' })
  filePath?: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/books/book.pdf', description: 'File URL' })
  fileUrl?: string;

  @ApiProperty({ type: [UnitDto], description: 'Book structure' })
  units: UnitDto[];

  @ApiProperty({ example: 0, description: 'Offset for PDF vs Printed page numbers' })
  pageOffset: number;
}


