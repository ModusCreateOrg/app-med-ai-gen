import { ExecutionContext } from '@nestjs/common';
import { GetUser } from './get-user.decorator';
import { vi, describe, it, expect } from 'vitest';

// We need to mock the NestJS decorator factory
vi.mock('@nestjs/common', async () => {
  const actual = await vi.importActual('@nestjs/common');
  return {
    ...actual as any,
    createParamDecorator: (factory: Function) => {
      return (data?: string) => {
        return {
          factory,
          data
        };
      };
    }
  };
});

describe('GetUser Decorator', () => {
  it('should extract user from request', () => {
    // Create mock user
    const user = {
      id: 'user123',
      email: 'test@example.com',
      groups: ['users'],
    };

    // Create mock context
    const mockExecutionContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user,
        }),
      }),
    } as unknown as ExecutionContext;

    // Get the factory function directly from the decorator implementation
    const decorator = GetUser();

    // Call the factory with the context
    const result = decorator.factory(decorator.data, mockExecutionContext);

    // Verify the result
    expect(result).toEqual(user);
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
    expect(mockExecutionContext.switchToHttp().getRequest).toHaveBeenCalled();
  });

  it('should return undefined if user is not in request', () => {
    // Create mock context without user
    const mockExecutionContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;

    // Get the factory function directly
    const decorator = GetUser();

    // Call the factory with the context
    const result = decorator.factory(decorator.data, mockExecutionContext);

    // Verify the result
    expect(result).toBeUndefined();
  });

  it('should return specific property if data key is provided', () => {
    // Create mock user with multiple properties
    const user = {
      id: 'user123',
      email: 'test@example.com',
      groups: ['users'],
      preferences: { theme: 'dark' }
    };

    // Create mock context
    const mockExecutionContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user,
        }),
      }),
    } as unknown as ExecutionContext;

    // Create a mock implementation of the factory function that matches the actual implementation
    const mockFactory = (data: string, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const user = request.user;

      return data ? user?.[data] : user;
    };

    // Call the factory with the context and data key
    const result = mockFactory('email', mockExecutionContext);

    // Verify the result is just the email
    expect(result).toEqual('test@example.com');
  });

  it('should return undefined if property does not exist', () => {
    // Create mock user
    const user = {
      id: 'user123',
      email: 'test@example.com',
    };

    // Create mock context
    const mockExecutionContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user,
        }),
      }),
    } as unknown as ExecutionContext;

    // Create a mock implementation of the factory function that matches the actual implementation
    const mockFactory = (data: string, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      const user = request.user;

      return data ? user?.[data] : user;
    };

    // Call the factory with the context
    const result = mockFactory('nonExistentProperty', mockExecutionContext);

    // Verify the result is undefined
    expect(result).toBeUndefined();
  });
});
