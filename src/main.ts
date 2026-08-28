import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { buildErrorResponse } from './http-exception.filter.js';

const rateLimit = new Map<string, { count: number; resetAt: number }>(); // TODO: se der tempo, trocar pra redis; por hora, isso aqui é suficiente pra não ficar feio

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

  app.use((req: any, res: any, next: any) => {
    const ip = req.ip;
    const now = Date.now();
    const entry = rateLimit.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimit.set(ip, { count: 1, resetAt: now + 60000 });
      return next();
    }

    entry.count++;
    if (entry.count > 30) return res.status(429).json(buildErrorResponse(429, 'too_many_requests', req));

    return next();
  });

  await app.init();

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance().use((req: any, res: any) => {
    res.status(404).json(buildErrorResponse(404, 'route_not_found', req));
  });

  const configService = app.get(ConfigService);

  await app.listen(configService.getOrThrow<number>('API_PORT'));
}
bootstrap();
