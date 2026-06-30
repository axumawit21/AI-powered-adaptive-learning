import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional, IsIn } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'student@example.com', description: 'Student email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Student password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Student full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'student@example.com', description: 'Student email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Student password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'student', description: 'User role (defaults to student)' })
  @IsOptional()
  @IsString()
  @IsIn(['student'])
  role?: string;

  @ApiPropertyOptional({ example: 9, description: 'Grade level (1-12)' })
  @IsOptional()
  gradeNumber?: number;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldpassword123', description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'newpassword123', description: 'New password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  access_token: string;
}

export class ProfileResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'User ID' })
  userId: string;

  @ApiProperty({ example: 'student@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'student', description: 'User role' })
  role: string;
}
