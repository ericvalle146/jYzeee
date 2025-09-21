import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });
  
  // Servir arquivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/static/',
  });
  
  await app.listen(3002, '0.0.0.0');
}

bootstrap();
