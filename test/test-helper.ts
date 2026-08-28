import { Test } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/http-exception.filter.js';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('v1');
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

  return app;
}
