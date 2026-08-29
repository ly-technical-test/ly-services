import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  const mockCustomersService = {
    create: jest.fn<any>(),
    findAll: jest.fn<any>(),
    findOne: jest.fn<any>(),
    update: jest.fn<any>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [CustomersController],
      providers: [
        { provide: CustomersService, useValue: mockCustomersService },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get<CustomersService>(CustomersService);
    jest.clearAllMocks();
  });

  it('defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('creates customer', async () => {
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
      const req = { user: { userId: 'user_123' } };
      const expected = { _id: 'cust_1' };
      mockCustomersService.create.mockResolvedValue(expected);

      const result = await controller.create(req, dto as any);
      expect(service.create).toHaveBeenCalledWith('user_123', dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('returns customers', async () => {
      const req = { user: { userId: 'user_123' } };
      const expected = [{ _id: 'cust_1' }];
      mockCustomersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(req);
      expect(service.findAll).toHaveBeenCalledWith('user_123');
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('returns customer by id', async () => {
      const req = { user: { userId: 'user_123' } };
      const expected = { _id: 'cust_1' };
      mockCustomersService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(req, 'cust_1');
      expect(service.findOne).toHaveBeenCalledWith('user_123', 'cust_1');
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('updates customer', async () => {
      const req = { user: { userId: 'user_123' } };
      const dto = { name: 'Novo Nome' };
      const expected = { _id: 'cust_1', name: 'Novo Nome' };
      mockCustomersService.update.mockResolvedValue(expected);

      const result = await controller.update(req, 'cust_1', dto as any);
      expect(service.update).toHaveBeenCalledWith('user_123', 'cust_1', dto);
      expect(result).toEqual(expected);
    });
  });
});
