import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProgressService } from '../progress/progress.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const progressService = app.get(ProgressService);

  // Replace with actual student ID from your database
  const studentId = process.argv[2] || 'test-student-id';
  
  console.log('Checking progress for student:', studentId);
  
  try {
    const overview = await progressService.getOverview(studentId);
    console.log('Progress records found:', overview.length);
    console.log('Records:', JSON.stringify(overview, null, 2));
    
    const dashboard = await progressService.getDashboardOverview(studentId);
    console.log('\nDashboard data:', JSON.stringify(dashboard, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  await app.close();
}

bootstrap();
