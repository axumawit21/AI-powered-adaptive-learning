import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateGradeDto {
  @ApiProperty({ example: 'Grade 10', description: 'Grade title/name' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 10, description: 'Grade number (unique)' })
  @IsNumber()
  gradeNumber: number;
}

export class UpdateGradeDto {
  @ApiPropertyOptional({ example: 'Grade 10 Updated', description: 'Grade title/name' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 10, description: 'Grade number' })
  @IsOptional()
  @IsNumber()
  gradeNumber?: number;
}

export class GradeResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Grade ID' })
  _id: string;

  @ApiProperty({ example: 'Grade 10', description: 'Grade title/name' })
  title: string;

  @ApiProperty({ example: 10, description: 'Grade number' })
  gradeNumber: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
