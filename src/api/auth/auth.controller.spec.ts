import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn<any>(),
    login: jest.fn<any>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('returns access_token', async () => {
      const registerDto = {
        name: 'Teste',
        email: 'teste@example.com',
        password: 'password123',
      };
      const expectedResult = {
        access_token: 'jwt_token',
        user: { id: 'user_id', name: 'Teste', email: 'teste@example.com' },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('returns access_token', async () => {
      const loginDto = {
        email: 'teste@example.com',
        password: 'password123',
      };
      const expectedResult = {
        access_token: 'jwt_token',
        user: { id: 'user_id', name: 'Teste', email: 'teste@example.com' },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
