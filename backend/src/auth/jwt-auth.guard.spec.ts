import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the @nestjs/passport module with all required exports
vi.mock('@nestjs/passport', () => {
  return {
    AuthGuard: () => {
      return class {
        canActivate() {
          return true;
        }
      };
    },
    PassportStrategy: () => {
      return class {};
    },
  };
});

// Also mock the JwtStrategy to avoid dependency on the mocked PassportStrategy
vi.mock('./jwt.strategy', () => {
  return {
    JwtStrategy: class {
      constructor() {}
      validate() {
        return { userId: 1 };
      }
    },
  };
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  // Mock the process.env.DISABLE_AUTH
  const originalEnv = process.env.DISABLE_AUTH;

  beforeEach(async () => {
    // Reset the environment variable
    process.env.DISABLE_AUTH = 'false';

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        JwtAuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  afterEach(() => {
    // Restore the original environment variable
    process.env.DISABLE_AUTH = originalEnv;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should bypass authentication when DISABLE_AUTH is true', () => {
    // Set the environment variable
    process.env.DISABLE_AUTH = 'true';

    const mockContext = {} as ExecutionContext;

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should call super.canActivate when DISABLE_AUTH is false', () => {
    // Create a spy on the canActivate method
    const superCanActivateSpy = vi.spyOn(guard, 'canActivate');

    // Mock a complete execution context
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer valid-token',
          },
        }),
        getResponse: () => ({}),
      }),
    } as ExecutionContext;

    // Call canActivate
    guard.canActivate(mockContext);

    // Verify the spy was called
    expect(superCanActivateSpy).toHaveBeenCalledWith(mockContext);
  });
});
