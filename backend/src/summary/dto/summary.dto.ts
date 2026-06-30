import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class SummarizeDto {
  @ApiProperty({ example: '60d5ec...', description: 'Grade ID' })
  @IsString()
  @IsNotEmpty()
  gradeId: string;

  @ApiProperty({ example: '60d5ec...', description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ example: '1', description: 'Unit number, title, or subunit ID' })
  @IsString()
  @IsNotEmpty()
  unitIdentifier: string;

  @ApiProperty({ example: 'unit', enum: ['unit', 'subunit'], description: 'Type of summary generation' })
  @IsEnum(['unit', 'subunit'])
  type: 'unit' | 'subunit';

  @ApiPropertyOptional({ example: 'Grade 9', description: 'Grade Title (optional)' })
  @IsOptional()
  @IsString()
  gradeTitle?: string;

  @ApiPropertyOptional({ example: 'Biology', description: 'Subject Title (optional)' })
  @IsOptional()
  @IsString()
  subjectTitle?: string;

  @ApiPropertyOptional({ example: '1.1', description: 'Subunit identifier (optional, for subunit-level summary)' })
  @IsOptional()
  @IsString()
  subunitIdentifier?: string;

  @ApiPropertyOptional({ example: 'Cell Structure', description: 'Subunit title (optional)' })
  @IsOptional()
  @IsString()
  subunitTitle?: string;
}

export class ChapterSummaryDto {
    @ApiProperty()
    unit: string;
  
    @ApiProperty()
    summary: string;
  
    @ApiProperty()
    chunksUsed: number;
}

export class SummarizeResponseDto {
  @ApiProperty({ example: true, description: 'Whether the request was successful' })
  ok: boolean;

  @ApiPropertyOptional({ type: ChapterSummaryDto, description: 'Summary data' })
  data?: ChapterSummaryDto;

  @ApiPropertyOptional({ example: 'Error generating summary', description: 'Error message' })
  message?: string;
}
