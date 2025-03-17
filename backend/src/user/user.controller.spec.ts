import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: vi.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        groups: ['users'],
      };

      const result = controller.getProfile(mockUser);

      expect(result).toEqual({
        message: 'Authentication successful',
        user: mockUser,
      });
    });

    it('should handle user with minimal information', () => {
      const minimalUser = {
        id: '456',
        username: 'minimaluser',
        email: 'minimal@example.com',
        groups: [],
      };

      const result = controller.getProfile(minimalUser);

      expect(result).toEqual({
        message: 'Authentication successful',
        user: minimalUser,
      });
    });
  });
});
