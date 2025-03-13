import { Test, TestingModule } from '@nestjs/testing';
import { AuthMiddleware } from './auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let jwtService: JwtService;
  let configService: ConfigService;

  // Create a mock payload that will be returned by the verify method
  const mockPayload = {
    sub: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    groups: ['users'],
  };

  beforeEach(async () => {
    // Create the testing module with real spies
    const verifyMock = vi.fn().mockReturnValue(mockPayload);
    const getMock = vi.fn().mockReturnValue('test-secret');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        {
          provide: JwtService,
          useValue: {
            verify: verifyMock,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: getMock,
          },
        },
      ],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it.skip('should set user on request when valid token is provided', () => {
    // Create a mock request with a valid token
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      user: undefined,
    };
    const mockResponse = {};
    const mockNext = vi.fn();

    // Call the middleware
    middleware.use(mockRequest as any, mockResponse as any, mockNext);

    // Verify the JwtService.verify was called with the correct arguments
    expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
      secret: 'test-secret',
    });

    // Verify the user was set on the request
    expect(mockRequest.user).toEqual({
      id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      groups: ['users'],
    });

    // Verify next was called
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
    jwtService.verify.mockImplementation(() => {
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
