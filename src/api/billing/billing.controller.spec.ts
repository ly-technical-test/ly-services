import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';

describe('BillingController', () => {
  let controller: BillingController;
  let service: BillingService;

  const mockBillingService = {
    issueCharge: jest.fn<any>(),
    simulatePayment: jest.fn<any>(),
    payWithCreditCard: jest.fn<any>(),
    listCharges: jest.fn<any>(),
    getCharge: jest.fn<any>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: mockBillingService },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
  });

  it('defined', () => {
    expect(controller).toBeDefined();
  });

  describe('issueCharge', () => {
    it('issues charge', async () => {
      const dto = {
        customerId: '507f1f77bcf86cd799439012',
        amount: 100,
        description: 'Test',
        payment_method: 'pix',
      };
      const req = { user: { userId: 'user_123' } };
      const expected = { _id: 'charge_1' };
      mockBillingService.issueCharge.mockResolvedValue(expected);

      const result = await controller.issueCharge(req, dto);
      expect(service.issueCharge).toHaveBeenCalledWith('user_123', dto);
      expect(result).toEqual(expected);
    });
  });

  describe('simulatePayment', () => {
    it('simulates payment', async () => {
      const req = { user: { userId: 'user_123' } };
      const expected = { _id: 'charge_1', status: 'PAID' };
      mockBillingService.simulatePayment.mockResolvedValue(expected);

      const result = await controller.simulatePayment(req, 'charge_1', { paymentMethod: 'pix' });
      expect(service.simulatePayment).toHaveBeenCalledWith('user_123', 'charge_1', 'pix');
      expect(result).toEqual(expected);
    });
  });

  describe('payWithCreditCard', () => {
    it('pays with card', async () => {
      const req = { user: { userId: 'user_123' } };
      const dto = {
        chargeId: 'charge_1',
        cardNumber: '4000000000000010',
        holder: 'TESTE TEC GABRIEL',
        expiry: '1228',
        cvc: '123',
      };
      const expected = { _id: 'charge_1', status: 'PAID', cardToken: 'card_token_123' };
      mockBillingService.payWithCreditCard.mockResolvedValue(expected);

      const result = await controller.payWithCreditCard(req, dto);
      expect(service.payWithCreditCard).toHaveBeenCalledWith('user_123', dto);
      expect(result).toEqual(expected);
    });
  });

  describe('listCharges', () => {
    it('returns list', async () => {
      const req = { user: { userId: 'user_123' } };
      const expected = [{ _id: 'charge_1' }];
      mockBillingService.listCharges.mockResolvedValue(expected);

      const result = await controller.listCharges(req);
      expect(service.listCharges).toHaveBeenCalledWith('user_123');
      expect(result).toEqual(expected);
    });
  });

  describe('getCharge', () => {
    it('returns charge details', async () => {
      const expected = { _id: 'charge_1', amount: 100 };
      mockBillingService.getCharge.mockResolvedValue(expected);

      const result = await controller.getCharge('charge_1');
      expect(service.getCharge).toHaveBeenCalledWith('charge_1');
      expect(result).toEqual(expected);
    });
  });
});
