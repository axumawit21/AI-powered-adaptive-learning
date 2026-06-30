import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';

export class GenerateExamDto {
  @ApiProperty({ example: 'Math', description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: 'Grade 9', description: 'Grade ID', required: false })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiProperty({ example: 'Unit 1', description: 'Unit ID', required: false })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiProperty({ example: 'unit', enum: ['unit', 'subject'], description: 'Exam type' })
  @IsEnum(['unit', 'subject'])
  type: 'unit' | 'subject';

  @ApiProperty({ example: 10, description: 'Number of questions to generate', required: false })
  @IsOptional()
  @IsNumber()
  numQuestions?: number;
}

export class SubmitExamDto {
  @ApiProperty({ example: 'exam_id_123', description: 'Exam Session ID' })
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ 
    description: 'List of answers', 
    example: [{ questionIndex: 0, answer: 'A' }] 
  })
  @IsArray()
  answers: { questionIndex: number; answer: string }[];
}
