import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AskDto {
  @ApiProperty({ example: '10', description: 'Grade level (ID or number)' })
  @IsString()
  grade: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject name or ID' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'What is the Pythagorean theorem?', description: 'Question to ask' })
  @IsString()
  question: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'Existing session ID to continue conversation' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Selected unit number for scoped search' })
  @IsOptional()
  selectedUnit?: number;

  @ApiPropertyOptional({ description: 'Selected subunit number for more specific search' })
  @IsOptional()
  selectedSubunit?: string;

  @ApiPropertyOptional({ description: 'Unit title for text-based matching' })
  @IsOptional()
  @IsString()
  unitTitle?: string;

  @ApiPropertyOptional({ description: 'Subunit title for text-based matching' })
  @IsOptional()
  @IsString()
  subunitTitle?: string;
}

export class AskResponseDto {
  @ApiProperty({ example: true, description: 'Whether the request was successful' })
  ok: boolean;

  @ApiProperty({ example: 'The Pythagorean theorem states that...', description: 'AI-generated answer' })
  answer?: string;

  @ApiProperty({ example: 'Error message if any', description: 'Error message' })
  message?: string;

  @ApiProperty({ 
    example: { foundIn: 'differentUnit', notification: 'This answer is from Unit 5' },
    description: 'Source information showing where the answer was found'
  })
  sourceInfo?: {
    foundIn: 'selectedSubunit' | 'selectedUnit' | 'differentSubunit' | 'differentUnit' | 'generalKnowledge' | 'notEducational' | 'notFound';
    notification?: string;
    actualSource?: { unitNumber?: number; subunitNumber?: string; unitTitle?: string };
  };

  @ApiProperty({ example: ['What is the formula?', 'Give me an example'], description: 'Suggested follow-up questions' })
  suggestedQuestions?: string[];
}

