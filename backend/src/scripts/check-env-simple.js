const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { ConfigService } = require('@nestjs/config');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const uri = configService.get('MONGO_URI');
  console.log(`ACTUAL_MONGO_URI: ${uri}`);
  await app.close();
}
// bootstrap(); // Need it to be sync or handled... 
// actually I'll just use a plain JS script with dotenv
