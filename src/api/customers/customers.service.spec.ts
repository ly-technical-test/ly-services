import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { Customer } from './schemas/customer.schema.js';
import { LytexApiService } from '../billing/services/lytex-api.service.js';

describe('CustomersService', () => {
  let service: CustomersService;

  function MockCustomerModel(this: any, dto: any) {
    this.data = dto;
    this.save = jest.fn<any>().mockResolvedValue({ _id: 'cust_123', ...dto });
  }

  (MockCustomerModel as any).find = jest.fn<any>();
  (MockCustomerModel as any).findOne = jest.fn<any>();

  const mockLytexApiService = {
    createClient: jest.fn<any>(),
    updateClient: jest.fn<any>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getModelToken(Customer.name), useValue: MockCustomerModel },
        { provide: LytexApiService, useValue: mockLytexApiService },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    jest.clearAllMocks();
  });

  it('defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      name: 'Cliente Teste',
      email: 'cliente@test.com',
      cpfCnpj: '96050176876',
      address: {
        street: 'Rua Doutor Moacir Byrro',
        number: '100',
        zone: 'Centro',
        city: 'Coronel Fabriciano',
        state: 'MG',
        zip: '35170128',
      },
    };

    it('throws if cpf contains letters', async () => {
      await expect(service.create('user_123', { ...dto, cpfCnpj: '9605017687A' } as any)).rejects.toThrow('invalid_cpf_cnpj');
    });

    it('throws if lytex client creation fails', async () => {
      mockLytexApiService.createClient.mockResolvedValue(null);
      await expect(service.create('user_123', dto as any)).rejects.toThrow(InternalServerErrorException);
    });

    it('creates customer successfully', async () => {
      mockLytexApiService.createClient.mockResolvedValue({ _id: 'lytex_cust_123' });
      const result = await service.create('user_123', { ...dto, cpfCnpj: '960.501.768-76' } as any);
      expect(mockLytexApiService.createClient).toHaveBeenCalled();
      expect(result._id).toBe('cust_123');
      expect(result.cpfCnpj).toBe('96050176876');
    });
  });

  describe('findAll', () => {
    it('returns user customers without search', async () => {
      const customers = [{ _id: 'cust_1' }];
      const mockExec = jest.fn<any>().mockResolvedValue(customers);
      const mockSort = jest.fn<any>().mockReturnValue({ exec: mockExec });
      (MockCustomerModel as any).find.mockReturnValue({ sort: mockSort });

      const result = await service.findAll('user_123');
      expect((MockCustomerModel as any).find).toHaveBeenCalledWith({ user: 'user_123' });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(customers);
    });

    it('returns user customers with search filter', async () => {
      const customers = [{ _id: 'cust_1' }];
      const mockExec = jest.fn<any>().mockResolvedValue(customers);
      const mockSort = jest.fn<any>().mockReturnValue({ exec: mockExec });
      (MockCustomerModel as any).find.mockReturnValue({ sort: mockSort });

      const result = await service.findAll('user_123', 'term');
      expect((MockCustomerModel as any).find).toHaveBeenCalledWith({
        user: 'user_123',
        $or: [
          { name: { $regex: 'term', $options: 'i' } },
          { email: { $regex: 'term', $options: 'i' } },
          { cpfCnpj: { $regex: 'term', $options: 'i' } },
        ]
      });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(customers);
    });
  });

  describe('findOne', () => {
    it('throws if customer not found', async () => {
      (MockCustomerModel as any).findOne.mockReturnValue({
        exec: jest.fn<any>().mockResolvedValue(null),
      });
      await expect(service.findOne('user_123', 'cust_1')).rejects.toThrow(NotFoundException);
    });

    it('returns customer', async () => {
      const customer = { _id: 'cust_1' };
      (MockCustomerModel as any).findOne.mockReturnValue({
        exec: jest.fn<any>().mockResolvedValue(customer),
      });

      const result = await service.findOne('user_123', 'cust_1');
      expect(result).toEqual(customer);
    });
  });

  describe('update', () => {
    it('updates customer and lytex client', async () => {
      const mockSave = jest.fn<any>().mockResolvedValue({ _id: 'cust_1', name: 'Novo Nome' });
      const existingCustomer = {
        _id: 'cust_1',
        lytexClientId: 'lytex_1',
        cpfCnpj: '96050176876',
        name: 'Nome Antigo',
        toObject: () => ({ cpfCnpj: '96050176876', name: 'Nome Antigo' }),
        save: mockSave,
      };

      (MockCustomerModel as any).findOne.mockReturnValue({
        exec: jest.fn<any>().mockResolvedValue(existingCustomer),
      });
      mockLytexApiService.updateClient.mockResolvedValue({});

      const result = await service.update('user_123', 'cust_1', { name: 'Novo Nome' } as any);
      expect(mockLytexApiService.updateClient).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(result.name).toBe('Novo Nome');
    });
  });
});
