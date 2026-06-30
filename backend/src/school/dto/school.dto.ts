import { IsString, IsOptional, IsBoolean, IsNumber, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSchoolDto {
  @ApiProperty({ example: 'ABC High School' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ABC-001', description: 'Unique school code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '+251911234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  maxStudents?: number;
}

export class UpdateSchoolDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxStudents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  expiresAt?: Date;
}

export class CreateSectionDto {
  @ApiProperty({ example: '10-A', description: 'Section name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'School ID' })
  @IsString()
  schoolId: string;

  @ApiProperty({ description: 'Grade ID' })
  @IsString()
  gradeId: string;

  @ApiPropertyOptional({ description: 'Homeroom teacher ID' })
  @IsOptional()
  @IsString()
  homeroomTeacherId?: string;
}

export class UpdateSectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  homeroomTeacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * DTO for creating a section via the /:schoolId/sections route.
 * schoolId comes from the URL param, so it's not in the body.
 */
export class CreateSectionBodyDto {
  @ApiProperty({ example: '10-A', description: 'Section name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Grade ID' })
  @IsString()
  gradeId: string;

  @ApiPropertyOptional({ description: 'Homeroom teacher ID' })
  @IsOptional()
  @IsString()
  homeroomTeacherId?: string;
}

export class CreateSchoolAdminDto {
  @ApiProperty({ example: 'admin@school.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'School ID to assign' })
  @IsString()
  schoolId: string;
}

export class BulkImportStudentDto {
  @ApiProperty({ example: 'student@school.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'Student Name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'password123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '10-A' })
  @IsOptional()
  @IsString()
  sectionName?: string;
}

export class BulkImportResultDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  successful: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ type: [Object] })
  errors: { row: number; email: string; error: string }[];
}
