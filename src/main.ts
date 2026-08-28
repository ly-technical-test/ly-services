import { ValidationPipe, NotFoundException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'debug', 'log', 'warn', 'verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('v1');

  app.enableCors({
    origin: '*',
  });

  await app.init();

  const filter = new HttpExceptionFilter();
  app.use((req: any, res: any) => {
    filter.catch(new NotFoundException(), {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as any);
  });

  await app.listen(process.env.API_PORT || 3000);
}
bootstrap();
