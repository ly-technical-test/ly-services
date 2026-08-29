import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service.js';
import { Charge } from './schemas/charge.schema.js';
import { Customer } from '../customers/schemas/customer.schema.js';
import { UsersService } from '../users/users.service.js';
import { LytexApiService } from './services/lytex-api.service.js';

describe('BillingService', () => {
  let service: BillingService;

  const mockChargeModel = {
    create: jest.fn<any>(),
    findOne: jest.fn<any>(),
    find: jest.fn<any>(),
  };

  const mockCustomerModel = {
    findOne: jest.fn<any>(),
  };

  const mockUsersService = {
    findById: jest.fn<any>(),
    update: jest.fn<any>(),
  };

  const mockLytexApiService = {
    createClient: jest.fn<any>(),
    createInvoice: jest.fn<any>(),
    simulatePayment: jest.fn<any>(),
    tokenizeCard: jest.fn<any>(),
    payWithCard: jest.fn<any>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getModelToken(Charge.name), useValue: mockChargeModel },
        { provide: getModelToken(Customer.name), useValue: mockCustomerModel },
        { provide: UsersService, useValue: mockUsersService },
        { provide: LytexApiService, useValue: mockLytexApiService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
  });

  it('defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueCharge', () => {
    const baseDto = {
      customerId: '507f1f77bcf86cd799439012',
      amount: 100,
      description: 'Test charge',
      payment_method: 'pix',
    };

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
    };

    const mockCustomer = {
      _id: '507f1f77bcf86cd799439012',
      lytexClientId: 'lytex123',
    };

    it('throws if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(service.issueCharge('507f1f77bcf86cd799439011', baseDto as any)).rejects.toThrow(NotFoundException);
    });

    it('throws if customer not found', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCustomerModel.findOne.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(null) });
      await expect(service.issueCharge('507f1f77bcf86cd799439011', baseDto as any)).rejects.toThrow(NotFoundException);
    });

    it('throws if customer lacks lytexClientId', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCustomerModel.findOne.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue({ _id: '507f1f77bcf86cd799439012' }) });
      await expect(service.issueCharge('507f1f77bcf86cd799439011', baseDto as any)).rejects.toThrow(BadRequestException);
    });

    it('calls lytex and creates charge on success', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockCustomerModel.findOne.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(mockCustomer) });
      mockLytexApiService.createInvoice.mockResolvedValue({ _id: 'inv1', _hashId: 'hash1' });
      mockChargeModel.create.mockResolvedValue({ id: 'charge1' });

      const result = await service.issueCharge('507f1f77bcf86cd799439011', baseDto as any);
      expect(result).toEqual({ id: 'charge1' });
      expect(mockLytexApiService.createInvoice).toHaveBeenCalled();
      expect(mockChargeModel.create).toHaveBeenCalled();
    });
  });

  describe('simulatePayment', () => {
    it('throws if charge not found', async () => {
      mockChargeModel.findOne.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(null) });
      await expect(service.simulatePayment('507f1f77bcf86cd799439011', 'charge_1', 'pix')).rejects.toThrow(NotFoundException);
    });

    it('simulates payment successfully', async () => {
      const mockSave = jest.fn<any>().mockResolvedValue({ _id: 'charge_1', status: 'PAID' });
      const chargeDoc = { _id: 'charge_1', lytexId: 'lytex_1', status: 'PENDING', amount: 100, paymentMethod: 'pix', save: mockSave };
      mockChargeModel.findOne.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(chargeDoc) });
      mockLytexApiService.simulatePayment.mockResolvedValue({});

      const result = await service.simulatePayment('507f1f77bcf86cd799439011', 'charge_1', 'pix');
      expect(mockLytexApiService.simulatePayment).toHaveBeenCalledWith('lytex_1', 'pix', 100);
      expect(mockSave).toHaveBeenCalled();
      expect(result.status).toBe('PAID');
    });
  });

  describe('payWithCreditCard', () => {
    const dto = { chargeId: '507f1f77bcf86cd799439013' };
    const mockUser = { _id: '507f1f77bcf86cd799439011' };
    const mockCustomer = { _id: '507f1f77bcf86cd799439012', lytexClientId: 'lytex123', cpfCnpj: '96050176876' };
    const mockSave = jest.fn<any>().mockResolvedValue({ _id: '507f1f77bcf86cd799439013', status: 'PAID' });
    const mockCharge = { _id: '507f1f77bcf86cd799439013', user: '507f1f77bcf86cd799439011', paymentMethod: 'cartao', amount: 100, customer: mockCustomer, save: mockSave };

    it('throws if charge not found', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockChargeModel.findOne.mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(null) }) });
      await expect(service.payWithCreditCard('507f1f77bcf86cd799439011', dto as any)).rejects.toThrow(NotFoundException);
    });

    it('throws if payment method is not allowed', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      const invalidCharge = { ...mockCharge, paymentMethod: 'pix', customer: mockCustomer };
      mockChargeModel.findOne.mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(invalidCharge) }) });
      await expect(service.payWithCreditCard('507f1f77bcf86cd799439011', dto as any)).rejects.toThrow(BadRequestException);
    });

    it('creates token and calls payWithCard', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockChargeModel.findOne.mockReturnValue({ populate: jest.fn().mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(mockCharge) }) });
      mockLytexApiService.tokenizeCard.mockResolvedValue({ _id: 'token123' });
      mockLytexApiService.payWithCard.mockResolvedValue({});

      const result = await service.payWithCreditCard('507f1f77bcf86cd799439011', dto as any);
      expect(mockLytexApiService.tokenizeCard).toHaveBeenCalled();
      expect(mockLytexApiService.payWithCard).toHaveBeenCalled();
      expect(result.status).toBe('PAID');
    });
  });

  describe('listCharges', () => {
    it('returns charges list', async () => {
      const charges = [{ _id: 'charge_1' }, { _id: 'charge_2' }];
      mockChargeModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn<any>().mockResolvedValue(charges),
        }),
      });

      const result = await service.listCharges('507f1f77bcf86cd799439011');
      expect(mockChargeModel.find).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439011' });
      expect(result).toEqual(charges);
    });
  });
});
