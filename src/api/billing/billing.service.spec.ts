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
    findById: jest.fn<any>(),
    countDocuments: jest.fn<any>(),
  };

  const mockCustomerModel = {
    findOne: jest.fn<any>(),
    find: jest.fn<any>(),
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
    getInvoice: jest.fn<any>(),
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
    it('returns charges list without filters', async () => {
      const charges = [{ _id: 'charge_1' }, { _id: 'charge_2' }];
      const mockExec = jest.fn<any>().mockResolvedValue(charges);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockChargeModel.find.mockReturnValue({ sort: mockSort });

      const result = await service.listCharges('507f1f77bcf86cd799439011');
      expect(mockChargeModel.find).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439011' });
      expect(result).toEqual(charges);
    });

    it('returns charges list with filters', async () => {
      const charges = [{ _id: 'charge_1' }];
      const mockExec = jest.fn<any>().mockResolvedValue(charges);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockChargeModel.find.mockReturnValue({ sort: mockSort });

      const customers = [{ _id: 'cust_1' }];
      mockCustomerModel.find = jest.fn<any>().mockReturnValue({
        exec: jest.fn<any>().mockResolvedValue(customers),
      });

      const result = await service.listCharges('507f1f77bcf86cd799439011', 'teste', 'PAID');
      
      expect(mockCustomerModel.find).toHaveBeenCalledWith({
        user: '507f1f77bcf86cd799439011',
        name: { $regex: 'teste', $options: 'i' }
      }, '_id');
      
      expect(mockChargeModel.find).toHaveBeenCalledWith({
        user: '507f1f77bcf86cd799439011',
        status: 'PAID',
        $or: [
          { description: { $regex: 'teste', $options: 'i' } },
          { customer: { $in: ['cust_1'] } },
        ]
      });
      expect(result).toEqual(charges);
    });

    it('returns paginated charges list with page and limit', async () => {
      const charges = [{ _id: 'charge_1' }];
      const mockExec = jest.fn<any>().mockResolvedValue(charges);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      mockChargeModel.find.mockReturnValue({ sort: mockSort });
      mockChargeModel.countDocuments = jest.fn<any>().mockReturnValue({
        exec: jest.fn<any>().mockResolvedValue(50)
      });

      const result = await service.listCharges('507f1f77bcf86cd799439011', undefined, undefined, '2', '20');
      
      expect(mockChargeModel.find).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439011' });
      expect(mockSkip).toHaveBeenCalledWith(20);
      expect(mockLimit).toHaveBeenCalledWith(20);
      expect(mockChargeModel.countDocuments).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439011' });
      expect(result).toEqual({ data: charges, total: 50, totalPages: 3, page: 2, limit: 20 });
    });
  });

  describe('getCharge', () => {
    it('charge not found', async () => {
      mockChargeModel.findById.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(null) });
      await expect(service.getCharge('charge_1')).rejects.toThrow(NotFoundException);
    });

    it('returns public charge details', async () => {
      const chargeDoc = {
        _id: 'charge_1',
        lytexId: 'lytex_1',
        toObject: () => ({
          _id: 'charge_1',
          user: 'user_1',
          customer: 'cust_1',
          lytexId: 'lytex_1',
          lytexHashId: 'hash_1',
          linkCheckout: 'http://checkout.link',
          linkBoleto: 'http://boleto.link',
        }),
      };
      mockChargeModel.findById.mockReturnValue({ exec: jest.fn<any>().mockResolvedValue(chargeDoc) });
      
      const invoice = {
        linkBoleto: 'http://boleto.link',
        transactions: [
          { pix: { qrcode: 'pix_code' } },
          { boleto: { barcode: '123', digitableLine: '456' } },
        ],
      };
      mockLytexApiService.getInvoice.mockResolvedValue(invoice);

      const result = await service.getCharge('charge_1');
      expect(mockLytexApiService.getInvoice).toHaveBeenCalledWith('lytex_1');
      expect(result.pix.qrcode).toBe('pix_code');
      expect(result.boleto.barcode).toBe('123');
      expect(result.boleto.digitableLine).toBe('456');
      expect(result.linkBoleto).toBe('http://boleto.link');
      expect(result.user).toBeUndefined();
      expect(result.customer).toBeUndefined();
      expect(result.lytexId).toBeUndefined();
      expect(result.lytexHashId).toBeUndefined();
      expect(result.linkCheckout).toBeUndefined();
    });
  });
});
