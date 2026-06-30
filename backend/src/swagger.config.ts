import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Adaptive Learning API')
  .setDescription(`
## Adaptive Learning Platform API

This API provides endpoints for managing an adaptive learning platform with the following features:

### Features
- **Authentication**: Student and Admin login/registration
- **Books**: Upload, manage, and structure educational books
- **Grades & Subjects**: Organize content by grade levels and subjects
- **AI-Powered Features**:
  - Question answering (Chat)
  - Quiz generation
  - Chapter summarization
- **Progress Tracking**: Monitor student study time and progress
- **Vector Search**: Qdrant-powered semantic search for content

### Authentication
Most endpoints are public. Protected endpoints require a JWT Bearer token obtained from login endpoints.
  `)
  .setVersion('1.0.0')
  .setContact('Adaptive Learning Team', '', 'support@adaptive-learning.com')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .addTag('Admin', 'Admin authentication and management')
  .addTag('Auth', 'Student authentication')
  .addTag('Analytics', 'Dashboard and statistics')
  .addTag('Grades', 'Grade level management')
  .addTag('Subjects', 'Subject management')
  .addTag('Books', 'Book upload and management')
  .addTag('Preprocess', 'Book preprocessing and embedding generation')
  .addTag('Students', 'Student management')
  .addTag('Progress', 'Student progress tracking')
  .addTag('Chat', 'AI-powered question answering')
  .addTag('Quiz', 'AI-powered quiz generation')
  .addTag('Quiz Session', 'Interactive quiz sessions')
  .addTag('Summary', 'AI-powered chapter summarization')
  .addTag('System', 'System health and diagnostics')
  .build();
