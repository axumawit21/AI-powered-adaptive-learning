import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class TeacherRegisterDto {
  @ApiProperty({ example: 'John Teacher', description: 'Teacher full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'teacher@example.com', description: 'Teacher email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Grade ID (ObjectId)' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439022', description: 'Subject ID (ObjectId)' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439033', description: 'School ID (ObjectId)' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ description: 'Personal Gemini API key (from aistudio.google.com)' })
  @IsOptional()
  @IsString()
  geminiApiKey?: string;
}
