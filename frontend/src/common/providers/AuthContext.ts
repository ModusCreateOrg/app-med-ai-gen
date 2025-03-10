import { createContext } from 'react';
import { QueryObserverBaseResult } from '@tanstack/react-query';

import { AuthError, AuthState, UserTokens } from 'common/models/auth';
import { CognitoUser } from 'common/models/user';

/**
 * The `value` provided by the `AuthContext`.
 */
export interface AuthContextValue {
  // Authentication state
  isAuthenticated: boolean;
  authState: AuthState;
  isLoading: boolean;
  
  // Token management
  userTokens?: UserTokens;
  refetchUserTokens?: () => Promise<QueryObserverBaseResult<UserTokens, Error>>;
  
  // User data
  user?: CognitoUser;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Social authentication
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  
  // Error handling
  error?: AuthError;
  clearError: () => void;
}

/**
 * The default `AuthContext` value.
 */
const DEFAULT_CONTEXT_VALUE: AuthContextValue = {
  isAuthenticated: false,
  authState: AuthState.SIGNED_OUT,
  isLoading: false,
  
  // Placeholder implementations - will be replaced by actual implementations in the provider
  signIn: async () => { throw new Error('AuthContext not initialized'); },
  signUp: async () => { throw new Error('AuthContext not initialized'); },
  confirmSignUp: async () => { throw new Error('AuthContext not initialized'); },
  resendConfirmationCode: async () => { throw new Error('AuthContext not initialized'); },
  signOut: async () => { throw new Error('AuthContext not initialized'); },
  signInWithGoogle: async () => { throw new Error('AuthContext not initialized'); },
  signInWithApple: async () => { throw new Error('AuthContext not initialized'); },
  clearError: () => { /* empty implementation */ },
};

/**
 * The `AuthContext` instance.
 */
export const AuthContext = createContext<AuthContextValue>(DEFAULT_CONTEXT_VALUE);
