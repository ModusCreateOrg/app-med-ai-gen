import { Test, TestingModule } from '@nestjs/testing';
import { AuthMiddleware } from './auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let jwtService: JwtService;

  const mockJwtService = {
    verify: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should set user on request when valid token is provided', () => {
    const mockPayload = {
      sub: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      groups: ['users'],
    };

    mockJwtService.verify.mockReturnValue(mockPayload);

    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      user: undefined,
    };

    const mockResponse = {};
    const mockNext = vi.fn();

    middleware.use(mockRequest as any, mockResponse as any, mockNext);

    expect(mockRequest.user).toEqual({
      id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      groups: ['users'],
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('should not set user when no token is provided', () => {
    const mockRequest = {
      headers: {},
      user: undefined,
    };

    const mockResponse = {};
    const mockNext = vi.fn();

    middleware.use(mockRequest as any, mockResponse as any, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should not set user when token verification fails', () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const mockRequest = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
      user: undefined,
    };

    const mockResponse = {};
    const mockNext = vi.fn();

    middleware.use(mockRequest as any, mockResponse as any, mockNext);

    expect(mockRequest.user).toBeUndefined();
    expect(mockNext).toHaveBeenCalled();
  });
});
