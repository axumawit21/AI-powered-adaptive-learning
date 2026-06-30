import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Admin email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'admin123', description: 'Admin password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AdminRegisterDto {
  @ApiProperty({ example: 'John Admin', description: 'Admin full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'admin@example.com', description: 'Admin email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'admin123', description: 'Admin password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'school_admin', description: 'Admin role' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011', description: 'School ID for school admins' })
  @IsString()
  @IsOptional()
  schoolId?: string;
}

export class AdminResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Admin ID' })
  _id: string;

  @ApiProperty({ example: 'John Admin', description: 'Admin full name' })
  name: string;

  @ApiProperty({ example: 'admin@example.com', description: 'Admin email address' })
  email: string;

  @ApiProperty({ example: 'admin', description: 'User role' })
  role: string;
}

export class AdminLoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  access_token: string;
}
