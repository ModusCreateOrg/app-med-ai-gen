import { Test, TestingModule } from '@nestjs/testing';
import { AuthMiddleware } from './auth.middleware';
import { JwtService } from './jwt.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;

  // Create a mock JwtService
  const mockJwtService = {
    verifyToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should not add user to request when token is missing', async () => {
      const mockRequest: any = {
        headers: {},
      };
      const mockResponse = {};
      const mockNext = vi.fn();

      // Test the middleware
      await middleware.use(mockRequest, mockResponse as any, mockNext);

      expect(mockRequest).not.toHaveProperty('user');
      expect(mockNext).toHaveBeenCalled();
      expect(mockJwtService.verifyToken).not.toHaveBeenCalled();
    });
  });
});
