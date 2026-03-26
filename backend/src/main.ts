import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const app = await NestFactory.create(AppModule, {
    cors:
      corsOrigins.length > 0
        ? {
            origin: corsOrigins,
            credentials: true,
          }
        : true,
  });
  app.setGlobalPrefix('api/v1');

  const port = Number(process.env.PORT || 4100);
  await app.listen(port, '0.0.0.0');
  console.log(`Welfare mall Nest backend listening on port ${port}`);
}

bootstrap();
