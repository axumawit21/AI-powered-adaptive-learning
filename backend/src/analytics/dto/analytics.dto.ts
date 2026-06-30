import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ example: 150, description: 'Total number of students' })
  totalStudents: number;

  @ApiProperty({ example: 25, description: 'Total number of books' })
  totalBooks: number;

  @ApiProperty({ example: 12, description: 'Total number of grades' })
  totalGrades: number;

  @ApiProperty({ example: 8, description: 'Total number of subjects' })
  totalSubjects: number;

  @ApiPropertyOptional({ description: 'Books grouped by grade' })
  booksByGrade?: { gradeId: string; gradeTitle: string; count: number }[];

  @ApiPropertyOptional({ description: 'Recent activity' })
  recentActivity?: any[];
}
