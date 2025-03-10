import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuthOperations } from '../useAuthOperations';
import CognitoAuthService from 'common/services/auth/cognito-auth-service';
import * as AuthErrorUtils from 'common/utils/auth-errors';
import { SignInOutput, SignUpOutput, ConfirmSignUpOutput, ResendSignUpCodeOutput } from '@aws-amplify/auth';
import { AuthError } from 'common/models/auth';
import { CognitoUser } from 'common/models/user';

// Mock the CognitoAuthService
vi.mock('common/services/auth/cognito-auth-service', () => ({
  default: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    confirmSignUp: vi.fn(),
    resendConfirmationCode: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
  }
}));

// Mock auth-errors utils
vi.mock('common/utils/auth-errors', () => ({
  formatAuthError: vi.fn((err) => ({
    code: 'MockError',
    message: err instanceof Error ? err.message : 'Mock error message',
    name: 'MockError'
  }))
}));

// Mock user-mapper
vi.mock('common/utils/user-mapper', () => ({
  mapCognitoUserToAppUser: vi.fn((userData) => ({
    id: 'mock-id',
    username: userData.username || '',
    email: userData.attributes?.email || ''
  }))
}));

describe('useAuthOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should call CognitoAuthService.signIn with correct parameters', async () => {
      const mockSignInResult = { 
        username: 'test@example.com',
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' }
      } as unknown as SignInOutput;
      
      vi.mocked(CognitoAuthService.signIn).mockResolvedValueOnce(mockSignInResult);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(CognitoAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.user).toBeDefined();
    });

    it('should handle signIn errors', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(CognitoAuthService.signIn).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuthOperations());

      try {
        await act(async () => {
          await result.current.signIn('test@example.com', 'password123');
        });
      } catch {
        // Error is expected to be thrown
      }

      expect(CognitoAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(AuthErrorUtils.formatAuthError).toHaveBeenCalledWith(error);
    });
  });

  describe('signUp', () => {
    it('should call CognitoAuthService.signUp with correct parameters', async () => {
      const mockSignUpResult = {
        username: 'test@example.com', 
        userConfirmed: false,
        isSignUpComplete: false,
        nextStep: { signUpStep: 'CONFIRM_SIGN_UP' }
      } as unknown as SignUpOutput;
      
      vi.mocked(CognitoAuthService.signUp).mockResolvedValueOnce(mockSignUpResult);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'John', 'Doe');
      });

      expect(CognitoAuthService.signUp).toHaveBeenCalledWith(
        'test@example.com', 
        'password123', 
        { firstName: 'John', lastName: 'Doe' }
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      // User should not be set after sign up, as confirmation is required
      expect(result.current.user).toBeUndefined();
    });

    it('should handle signUp errors', async () => {
      const error = new Error('User already exists');
      vi.mocked(CognitoAuthService.signUp).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useAuthOperations());

      try {
        await act(async () => {
          await result.current.signUp('test@example.com', 'password123', 'John', 'Doe');
        });
      } catch {
        // Error is expected to be thrown
      }

      expect(CognitoAuthService.signUp).toHaveBeenCalledWith(
        'test@example.com', 
        'password123', 
        { firstName: 'John', lastName: 'Doe' }
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(AuthErrorUtils.formatAuthError).toHaveBeenCalledWith(error);
    });
  });

  describe('confirmSignUp', () => {
    it('should call CognitoAuthService.confirmSignUp with correct parameters', async () => {
      const mockConfirmResult = {
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' }
      } as unknown as ConfirmSignUpOutput;
      
      vi.mocked(CognitoAuthService.confirmSignUp).mockResolvedValueOnce(mockConfirmResult);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.confirmSignUp('test@example.com', '123456');
      });

      expect(CognitoAuthService.confirmSignUp).toHaveBeenCalledWith('test@example.com', '123456');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('resendConfirmationCode', () => {
    it('should call CognitoAuthService.resendConfirmationCode with correct email', async () => {
      const mockResult = {
        deliveryMedium: 'EMAIL',
        destination: 'test@example.com',
        attributeName: 'email'
      } as unknown as ResendSignUpCodeOutput;
      
      vi.mocked(CognitoAuthService.resendConfirmationCode).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useAuthOperations());

      await act(async () => {
        await result.current.resendConfirmationCode('test@example.com');
      });

      expect(CognitoAuthService.resendConfirmationCode).toHaveBeenCalledWith('test@example.com');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('signOut', () => {
    it('should call CognitoAuthService.signOut and clear user', async () => {
      vi.mocked(CognitoAuthService.signOut).mockResolvedValueOnce(undefined);

      // Set up a hook with a user
      const { result } = renderHook(() => useAuthOperations());
      
      // Set a user value first
      const mockUser = { id: 'mock-id', username: 'test@example.com', email: 'test@example.com' };
      act(() => {
        result.current.user = mockUser as CognitoUser;
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(CognitoAuthService.signOut).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.user).toBeUndefined();
    });
  });

  describe('clearError', () => {
    it('should clear the error state', () => {
      const { result } = renderHook(() => useAuthOperations());
      
      // Set an error first
      act(() => {
        result.current.error = { 
          code: 'TestError', 
          message: 'Test error', 
          name: 'TestError' 
        } as AuthError;
      });
      
      // Verify error exists
      expect(result.current.error).toBeDefined();
      
      // Clear the error
      act(() => {
        result.current.clearError();
      });
      
      // Verify error is cleared
      expect(result.current.error).toBeUndefined();
    });
  });
}); 