import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from './jwt.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  // Create a mock JwtService
  const mockJwtService = {
    verifyToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException when token is missing', () => {
      const mockRequest = {
        headers: {},
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Authentication token is missing');
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const mockRequest = {
        headers: {
          'x-amzn-oidc-data': 'invalid-token',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      // Mock failed token verification
      mockJwtService.verifyToken.mockRejectedValue(new Error('Invalid token'));

      // Use try/catch to test the exception
      try {
        await guard.canActivate(mockContext);
        // If we get here, the test should fail
        expect(true).toBe(false); // This will fail if no exception is thrown
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).message).toBe('Invalid token');
      }
    });
  });
});
