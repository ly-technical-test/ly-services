import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter, buildErrorResponse } from '../src/http-exception.filter.js';
import { LytexApiService } from '../src/api/billing/services/lytex-api.service.js';

describe('Billing Flow (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let customerId: string;
  let chargeId: string;

  beforeAll(async () => {
    const mockLytexService = {
      createClient: jest.fn<any>().mockResolvedValue({ _id: 'lytex_cust_e2e_123' }),
      updateClient: jest.fn<any>().mockResolvedValue({ _id: 'lytex_cust_e2e_123' }),
      listClients: jest.fn<any>().mockResolvedValue([]),
      createInvoice: jest.fn<any>().mockResolvedValue({ _id: 'lytex_inv_e2e_456', _hashId: 'mock_hash' }),
      simulatePayment: jest.fn<any>().mockResolvedValue({ status: 'PAID' }),
      tokenizeCard: jest.fn<any>().mockResolvedValue({ _id: 'card_tok_123', cardToken: 'tok_123', validUntil: '2028-12', status: 'VALID' }),
      payWithCard: jest.fn<any>().mockResolvedValue({ status: 'PAID' }),
      payWithCreditCard: jest.fn<any>().mockResolvedValue({ status: 'PAID' }),
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LytexApiService)
      .useValue(mockLytexService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('v1');
    await app.init();

    const httpAdapter = app.getHttpAdapter();
    httpAdapter.getInstance().use((req: any, res: any) => {
      res.status(404).json(buildErrorResponse(404, 'not_found', req));
    });
  });

  it('register and login user', async () => {
    const email = `e2e_${Date.now()}@test.com`;
    const password = 'Password123!';

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ name: 'E2E User', email, password })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(200);

    token = loginRes.body.data.access_token;
    expect(token).toBeDefined();
  });

  it('gets user profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.name).toBe('E2E User');
  });

  it('creates customer', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'E2E Customer',
        email: `cust_${Date.now()}@test.com`,
        cpfCnpj: '96050176876',
        address: {
          street: 'Rua Doutor Moacir Byrro',
          number: '100',
          zone: 'Centro',
          city: 'Coronel Fabriciano',
          state: 'MG',
          zip: '35170128',
        },
      })
      .expect(201);

    customerId = res.body.data._id;
    expect(customerId).toBeDefined();
  });

  it('lists customers', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('gets customer by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data._id).toBe(customerId);
  });

  it('updates customer', async () => {
    const res = await request(app.getHttpServer())
      .put(`/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Customer Updated' })
      .expect(200);

    expect(res.body.data.name).toBe('E2E Customer Updated');
  });

  it('issues billing charge', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/billing/issue')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        amount: 15000,
        description: 'E2E Test Charge',
        payment_method: 'pix',
      })
      .expect(201);

    chargeId = res.body.data._id;
    expect(chargeId).toBeDefined();
  });

  it('lists charges', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/billing/list')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('simulates payment', async () => {
    await request(app.getHttpServer())
      .post(`/v1/billing/simulate/${chargeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentMethod: 'pix' })
      .expect(201);
  });

  it('pays with credit card', async () => {
    const cardChargeRes = await request(app.getHttpServer())
      .post('/v1/billing/issue')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        amount: 20000,
        description: 'E2E Card Charge',
        payment_method: 'cartao',
      })
      .expect(201);

    const cardChargeId = cardChargeRes.body.data._id;

    await request(app.getHttpServer())
      .post('/v1/billing/pay-card')
      .set('Authorization', `Bearer ${token}`)
      .send({
        chargeId: cardChargeId,
        cardNumber: '4000000000000010',
        holder: 'VALERIO ZORZATO',
        expiry: '1228',
        cvc: '123',
      })
      .expect(201);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
