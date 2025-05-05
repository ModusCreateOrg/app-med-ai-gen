import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuthOperations } from '../useAuthOperations';
import { DirectCognitoAuthService } from 'common/services/auth/direct-cognito-auth-service';
import * as AuthErrorUtils from 'common/utils/auth-errors';
import { AuthError, UserTokens } from 'common/models/auth';
import { CognitoUser } from 'common/models/user';
import * as UserMapper from 'common/utils/user-mapper';

// Mock the DirectCognitoAuthService
vi.mock('common/services/auth/direct-cognito-auth-service', () => ({
  DirectCognitoAuthService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    confirmSignUp: vi.fn(),
    resendConfirmationCode: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    forgotPassword: vi.fn(),
    confirmResetPassword: vi.fn(),
    getCurrentSession: vi.fn(),
    getUserTokens: vi.fn(),
    federatedSignIn: vi.fn(),
  },
}));

// Mock auth-errors utils
vi.mock('common/utils/auth-errors', () => ({
  formatAuthError: vi.fn((err) => ({
    code: 'MockError',
    message: err instanceof Error ? err.message : 'Mock error message',
    name: 'MockError',
  })),
}));

// Mock user-mapper
vi.mock('common/utils/user-mapper', () => ({
  mapCognitoUserToAppUser: vi.fn((userData) => ({
    id: 'mock-id',
    username: userData.username || '',
    email: userData.attributes?.email || '',
  })),
}));

describe('useAuthOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should call DirectCognitoAuthService.signIn with correct parameters', async () => {
      const mockSignInResult = {
        username: 'test@example.com',
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      } as unknown as UserTokens;

      vi.mocked(DirectCognitoAuthService.signIn).mockResolvedValueOnce(mockSignInResult);

      // Mock user mapper to return a user object
      const mockUser = { id: 'mock-id', username: 'test@example.com', email: 'test@example.com' };
      vi.mocked(UserMapper.mapCognitoUserToAppUser).mockReturnValue(mockUser as CognitoUser);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(DirectCognitoAuthService.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();

      // With proper assertions for the user object
      expect(result.current.user).toBeDefined();
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle signIn errors', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(DirectCognitoAuthService.signIn).mockRejectedValueOnce(error);

      // Mock the formatAuthError function to return a proper AuthError
      const mockError = { code: 'MockError', message: 'Invalid credentials', name: 'MockError' };
      vi.mocked(AuthErrorUtils.formatAuthError).mockReturnValueOnce(mockError as AuthError);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'password123');
        } catch {
          // Error is handled in the hook
        }
      });

      expect(DirectCognitoAuthService.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.error).toEqual(mockError);
      expect(AuthErrorUtils.formatAuthError).toHaveBeenCalledWith(error);
    });
  });

  describe('signUp', () => {
    it('should call DirectCognitoAuthService.signUp with correct parameters', async () => {
      const mockSignUpResult = {
        username: 'test@example.com',
        userConfirmed: false,
        isSignUpComplete: false,
        nextStep: { signUpStep: 'CONFIRM_SIGN_UP' },
      } as unknown;

      vi.mocked(DirectCognitoAuthService.signUp).mockResolvedValueOnce(mockSignUpResult);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'John', 'Doe');
      });

      expect(DirectCognitoAuthService.signUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        {
          firstName: 'John',
          lastName: 'Doe',
        },
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      // User should not be set after sign up, as confirmation is required
      expect(result.current.user).toBeUndefined();
    });

    it('should handle signUp errors', async () => {
      const error = new Error('User already exists');
      vi.mocked(DirectCognitoAuthService.signUp).mockRejectedValueOnce(error);

      // Mock the formatAuthError function to return a proper AuthError
      const mockError = { code: 'MockError', message: 'User already exists', name: 'MockError' };
      vi.mocked(AuthErrorUtils.formatAuthError).mockReturnValueOnce(mockError as AuthError);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        try {
          await result.current.signUp('test@example.com', 'password123', 'John', 'Doe');
        } catch {
          // Error is handled in the hook
        }
      });

      expect(DirectCognitoAuthService.signUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        {
          firstName: 'John',
          lastName: 'Doe',
        },
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.error).toEqual(mockError);
      expect(AuthErrorUtils.formatAuthError).toHaveBeenCalledWith(error);
    });
  });

  describe('confirmSignUp', () => {
    it('should call DirectCognitoAuthService.confirmSignUp with correct parameters', async () => {
      const mockConfirmResult = {
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' },
      } as unknown;

      vi.mocked(DirectCognitoAuthService.confirmSignUp).mockResolvedValueOnce(mockConfirmResult);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.confirmSignUp('test@example.com', '123456');
      });

      expect(DirectCognitoAuthService.confirmSignUp).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('resendConfirmationCode', () => {
    it('should call DirectCognitoAuthService.resendConfirmationCode with correct email', async () => {
      const mockResult = {
        deliveryMedium: 'EMAIL',
        destination: 'test@example.com',
        attributeName: 'email',
      } as unknown;

      vi.mocked(DirectCognitoAuthService.resendConfirmationCode).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.resendConfirmationCode('test@example.com');
      });

      expect(DirectCognitoAuthService.resendConfirmationCode).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('signOut', () => {
    it('should call DirectCognitoAuthService.signOut and clear user', async () => {
      vi.mocked(DirectCognitoAuthService.signOut).mockResolvedValueOnce(undefined);

      // Set up a hook with a user
      const { result } = renderHook(() => useAuthOperations());

      // Set a user value using the proper state mechanism
      const mockUser = { id: 'mock-id', username: 'test@example.com', email: 'test@example.com' };

      // First, we need to set up the user by simulating a successful sign-in
      vi.mocked(DirectCognitoAuthService.signIn).mockResolvedValueOnce({});
      vi.mocked(UserMapper.mapCognitoUserToAppUser).mockReturnValueOnce(mockUser as CognitoUser);

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      // Verify user is set
      expect(result.current.user).toEqual(mockUser);

      // Now test the sign-out functionality
      await act(async () => {
        await result.current.signOut();
      });

      expect(DirectCognitoAuthService.signOut).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.user).toBeUndefined();
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      const { result } = renderHook(() => useAuthOperations());

      // Set an error by simulating a failed sign-in
      const error = new Error('Test error');
      const mockError = {
        code: 'TestError',
        message: 'Test error',
        name: 'TestError',
      } as AuthError;

      vi.mocked(DirectCognitoAuthService.signIn).mockRejectedValueOnce(error);
      vi.mocked(AuthErrorUtils.formatAuthError).mockReturnValueOnce(mockError);

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'password123');
        } catch {
          // Error is handled in the hook
        }
      });

      // Verify error exists
      expect(result.current.error).toEqual(mockError);

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      // Verify error is cleared
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('forgotPassword', () => {
    it('should call DirectCognitoAuthService.forgotPassword with correct parameters', async () => {
      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.forgotPassword('test@example.com');
      });

      expect(DirectCognitoAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle forgotPassword errors', async () => {
      const error = new Error('Invalid email');
      vi.mocked(DirectCognitoAuthService.forgotPassword).mockRejectedValueOnce(error);

      const mockError = { code: 'MockError', message: 'Invalid email', name: 'MockError' };
      vi.mocked(AuthErrorUtils.formatAuthError).mockReturnValueOnce(mockError as AuthError);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        try {
          await result.current.forgotPassword('test@example.com');
        } catch {
          // Error is handled in the hook
        }
      });

      expect(DirectCognitoAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.error).toEqual(mockError);
      expect(AuthErrorUtils.formatAuthError).toHaveBeenCalledWith(error);
    });
  });

  describe('confirmResetPassword', () => {
    it('should call DirectCognitoAuthService.confirmResetPassword with correct parameters', async () => {
      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.confirmResetPassword('test@example.com', '123456', 'newPassword123');
      });

      expect(DirectCognitoAuthService.confirmResetPassword).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
        'newPassword123',
      );
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle confirmResetPassword errors', async () => {
      const error = new Error('Invalid verification code');
      vi.mocked(DirectCognitoAuthService.confirmResetPassword).mockRejectedValueOnce(error);

      const mockError = {
        code: 'MockError',
        message: 'Invalid verification code',
        name: 'MockError',
      };
      vi.mocked(AuthErrorUtils.formatAuthError).mockReturnValueOnce(mockError as AuthError);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        try {
          await result.current.confirmResetPassword('test@example.com', '123456', 'newPassword123');
        } catch {
          // Error is handled in the hook
        }
      });

      expect(DirectCognitoAuthService.confirmResetPassword).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
        'newPassword123',
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.error).toEqual(mockError);
      expect(AuthErrorUtils.formatAuthError).toHaveBeenCalledWith(error);
    });
  });
});
