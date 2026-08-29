import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter, buildErrorResponse } from '../src/http-exception.filter.js';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('v1');
  await app.init();

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance().use((req: any, res: any) => {
    res.status(404).json(buildErrorResponse(404, 'not_found', req));
  });

  return app;
}
