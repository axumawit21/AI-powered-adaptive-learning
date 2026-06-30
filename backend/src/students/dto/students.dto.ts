import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Student MongoDB ID' })
  _id: string;

  @ApiProperty({ example: 'STU-1704067200000', description: 'Student ID code' })
  studentId: string;

  @ApiProperty({ example: 'John Doe', description: 'Student full name' })
  name: string;

  @ApiProperty({ example: 'student@example.com', description: 'Student email address' })
  email: string;

  @ApiProperty({ example: 'student', description: 'User role' })
  role: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;
}

export class DeleteStudentResponseDto {
  @ApiProperty({ example: true, description: 'Whether deletion was successful' })
  deleted: boolean;

  @ApiPropertyOptional({ example: 'Student deleted successfully', description: 'Status message' })
  message?: string;
}
