import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { LytexApiService } from '../billing/services/lytex-api.service.js';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn<any>(),
    create: jest.fn<any>(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_jwt_token'),
  };

  const mockLytexApiService = {
    createClient: jest.fn(),
    updateClient: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: LytexApiService, useValue: mockLytexApiService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('duplicate email', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ _id: '1', email: 'existente@example.com' });

      await expect(
        service.register({
          name: 'Teste',
          email: 'existente@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns access_token', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const createdUser = {
        _id: 'user_123',
        name: 'New User',
        email: 'novo@example.com',
        passwordHash: 'hashed_password',
      };
      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await service.register({
        name: 'New User',
        email: 'novo@example.com',
        password: 'password123',
      });

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('novo@example.com');
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'mock_jwt_token',
        user: {
          id: 'user_123',
          name: 'New User',
          email: 'novo@example.com',
        },
      });
    });
  });

  describe('login', () => {
    it('user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'inexistente@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        _id: 'user_123',
        email: 'user@example.com',
        passwordHash: 'hashed_password',
      });
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false as never);

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'wrong_password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns access_token', async () => {
      const user = {
        _id: 'user_123',
        name: 'user',
        email: 'user@example.com',
        passwordHash: 'hashed_password',
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true as never);

      const result = await service.login({
        email: 'user@example.com',
        password: 'senha_correta',
      });

      expect(result).toEqual({
        access_token: 'mock_jwt_token',
        user: {
          id: 'user_123',
          name: 'user',
          email: 'user@example.com',
        },
      });
    });
  });
});

