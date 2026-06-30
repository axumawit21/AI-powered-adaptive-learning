import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics', description: 'Subject title/name' })
  @IsString()
  @IsNotEmpty()
  title: string;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional({ example: 'Advanced Mathematics', description: 'Subject title/name' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class SubjectResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Subject ID' })
  _id: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject title/name' })
  title: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update timestamp' })
  updatedAt: Date;
}
