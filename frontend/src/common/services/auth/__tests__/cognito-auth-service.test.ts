import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as AuthModule from '@aws-amplify/auth';
import CognitoAuthService from '../cognito-auth-service';
import { SignInOutput, SignUpOutput, ConfirmSignUpOutput, ResendSignUpCodeOutput, AuthUser, AuthSession } from '@aws-amplify/auth';

// Mock AWS Amplify Auth
vi.mock('@aws-amplify/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signOut: vi.fn(),
  fetchAuthSession: vi.fn(),
  getCurrentUser: vi.fn(),
  resendSignUpCode: vi.fn(),
  signInWithRedirect: vi.fn(),
  Amplify: {
    configure: vi.fn()
  }
}));

// Mock Amplify configure
vi.mock('aws-amplify', () => ({
  Amplify: {
    configure: vi.fn()
  }
}));

describe('CognitoAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should call Amplify Auth signIn with correct parameters', async () => {
      const username = 'test@example.com';
      const password = 'password123';
      const mockUser = { 
        username: 'test@example.com',
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' }
      } as SignInOutput;

      vi.mocked(AuthModule.signIn).mockResolvedValueOnce(mockUser);

      const result = await CognitoAuthService.signIn(username, password);

      expect(AuthModule.signIn).toHaveBeenCalledWith({ username, password });
      expect(result).toEqual(mockUser);
    });

    it('should handle signIn errors', async () => {
      const username = 'test@example.com';
      const password = 'password123';
      const error = new Error('Invalid credentials');

      vi.mocked(AuthModule.signIn).mockRejectedValueOnce(error);

      await expect(CognitoAuthService.signIn(username, password)).rejects.toThrow(error);
    });
  });

  describe('signUp', () => {
    it('should call Amplify Auth signUp with correct parameters', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const attributes = { firstName: 'John', lastName: 'Doe' };
      const mockResult = { 
        username: email, 
        userConfirmed: false,
        isSignUpComplete: false,
        nextStep: { signUpStep: 'CONFIRM_SIGN_UP' }
      } as unknown as SignUpOutput;

      vi.mocked(AuthModule.signUp).mockResolvedValueOnce(mockResult);

      const result = await CognitoAuthService.signUp(email, password, attributes);

      expect(AuthModule.signUp).toHaveBeenCalledWith({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: attributes.firstName,
            family_name: attributes.lastName,
          }
        }
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle signUp errors', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const attributes = { firstName: 'John', lastName: 'Doe' };
      const error = new Error('User already exists');

      vi.mocked(AuthModule.signUp).mockRejectedValueOnce(error);

      await expect(CognitoAuthService.signUp(email, password, attributes)).rejects.toThrow(error);
    });
  });

  describe('confirmSignUp', () => {
    it('should call Amplify Auth confirmSignUp with correct parameters', async () => {
      const username = 'test@example.com';
      const code = '123456';
      const mockResult = { 
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' }
      } as ConfirmSignUpOutput;

      vi.mocked(AuthModule.confirmSignUp).mockResolvedValueOnce(mockResult);

      const result = await CognitoAuthService.confirmSignUp(username, code);

      expect(AuthModule.confirmSignUp).toHaveBeenCalledWith({ 
        username, 
        confirmationCode: code 
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('resendConfirmationCode', () => {
    it('should call Amplify Auth resendSignUpCode with correct parameters', async () => {
      const username = 'test@example.com';
      const mockResult = {
        deliveryMedium: 'EMAIL',
        destination: username,
        attributeName: 'email'
      } as unknown as ResendSignUpCodeOutput;

      vi.mocked(AuthModule.resendSignUpCode).mockResolvedValueOnce(mockResult);

      const result = await CognitoAuthService.resendConfirmationCode(username);

      expect(AuthModule.resendSignUpCode).toHaveBeenCalledWith({ username });
      expect(result).toEqual(mockResult);
    });
  });

  describe('signOut', () => {
    it('should call Amplify Auth signOut', async () => {
      vi.mocked(AuthModule.signOut).mockResolvedValueOnce(undefined);

      await CognitoAuthService.signOut();

      expect(AuthModule.signOut).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should call Amplify Auth getCurrentUser and return user', async () => {
      const mockUser = {
        username: 'test@example.com',
        userId: 'test-user-id'
      } as AuthUser;
      
      vi.mocked(AuthModule.getCurrentUser).mockResolvedValueOnce(mockUser);

      const result = await CognitoAuthService.getCurrentUser();

      expect(AuthModule.getCurrentUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when getCurrentUser throws an error', async () => {
      vi.mocked(AuthModule.getCurrentUser).mockRejectedValueOnce(new Error('Not authenticated'));

      const result = await CognitoAuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentSession', () => {
    it('should call Amplify Auth fetchAuthSession and return session', async () => {
      const mockSession = { 
        tokens: { 
          idToken: { 
            toString: () => 'id-token',
            payload: {}
          },
          accessToken: { 
            toString: () => 'access-token',
            payload: {}
          } 
        } 
      } as unknown as AuthSession;
      
      vi.mocked(AuthModule.fetchAuthSession).mockResolvedValueOnce(mockSession);

      const result = await CognitoAuthService.getCurrentSession();

      expect(AuthModule.fetchAuthSession).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });

    it('should return null when fetchAuthSession throws an error', async () => {
      vi.mocked(AuthModule.fetchAuthSession).mockRejectedValueOnce(new Error('Not authenticated'));

      const result = await CognitoAuthService.getCurrentSession();

      expect(result).toBeNull();
    });
  });

  describe('getUserTokens', () => {
    it('should call Amplify Auth fetchAuthSession and return formatted tokens', async () => {
      const mockSession = { 
        tokens: { 
          idToken: { 
            toString: () => 'id-token',
            payload: {}
          },
          accessToken: { 
            toString: () => 'access-token',
            payload: { exp: Math.floor(Date.now() / 1000) + 3600 }
          } 
        } 
      } as unknown as AuthSession;

      vi.mocked(AuthModule.fetchAuthSession).mockResolvedValueOnce(mockSession);

      const result = await CognitoAuthService.getUserTokens();

      expect(AuthModule.fetchAuthSession).toHaveBeenCalled();
      expect(result).toMatchObject({
        access_token: 'access-token',
        id_token: 'id-token',
        token_type: 'bearer'
      });
      // Check that expires_in and expires_at are set
      expect(result?.expires_in).toBeDefined();
      expect(result?.expires_at).toBeDefined();
    });

    it('should return null when session has no tokens', async () => {
      vi.mocked(AuthModule.fetchAuthSession).mockResolvedValueOnce({} as AuthSession);

      const result = await CognitoAuthService.getUserTokens();

      expect(result).toBeNull();
    });
  });

  describe('federatedSignIn', () => {
    it('should call Amplify Auth signInWithRedirect with correct provider', async () => {
      await CognitoAuthService.federatedSignIn('Google');

      expect(AuthModule.signInWithRedirect).toHaveBeenCalledWith({ 
        provider: 'Google' 
      });
    });

    it('should throw error for unsupported provider', async () => {
      // @ts-expect-error - Testing invalid provider
      await expect(CognitoAuthService.federatedSignIn('Unknown')).rejects.toThrow('Unsupported provider');
    });
  });
}); 