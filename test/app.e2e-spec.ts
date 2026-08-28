import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './test-helper.js';
import { APP_E2E_CASES } from './fixtures/app.cases.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createTestApp();
  });

  it.each(APP_E2E_CASES)(
    '$description',
    async ({ method, path, expectedStatus, expectedBody }) => {
      const response = await request(app.getHttpServer())
        [method](path)
        .expect(expectedStatus);

      expect(response.body).toMatchObject(expectedBody);
      expect(response.body.metadata.responseAt).toBeDefined();
    },
  );

  afterEach(async () => {
    await app.close();
  });
});
