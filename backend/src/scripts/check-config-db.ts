import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const uri = configService.get<string>('MONGO_URI');
  console.log(`CURRENT_MONGO_URI: ${uri}`);
  
  // Also check the actual connection of the running app
  const connection = mongoose.connection;
  console.log(`ACTUAL_CONNECTION_DB: ${connection.name}`);

  await app.close();
}
bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
