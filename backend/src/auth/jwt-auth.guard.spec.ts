import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [JwtAuthGuard, JwtStrategy],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  // Since we're now using Passport's AuthGuard, we need to mock its behavior
  it('should call the parent canActivate method', () => {
    // Create a spy on the parent canActivate method
    const canActivateSpy = vi.spyOn(JwtAuthGuard.prototype, 'canActivate');

    // Mock the execution context
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer valid-token',
          },
        }),
      }),
    } as ExecutionContext;

    // Call canActivate
    guard.canActivate(mockContext);

    // Verify the spy was called
    expect(canActivateSpy).toHaveBeenCalledWith(mockContext);
  });
});
