import { useContext } from 'react';

import { AuthContext, AuthContextValue } from 'common/providers/AuthContext';

/**
 * The `useAuth` hook returns the current `AuthContext` value.
 * @returns {AuthContextValue} The current `AuthContext` value, `AuthContextValue`.
 */
export const useAuth = (): AuthContextValue => {
  return useContext(AuthContext);
};

/**
 * Check if a user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Get the current user
 * @returns The current user or undefined if not authenticated
 */
export const useCurrentUser = () => {
  const { user } = useAuth();
  return user;
};

/**
 * Get authentication loading state
 * @returns True if authentication is in progress, false otherwise
 */
export const useAuthLoading = (): boolean => {
  const { isLoading } = useAuth();
  return isLoading;
};

/**
 * Get authentication error
 * @returns The current authentication error or undefined
 */
export const useAuthError = () => {
  const { error, clearError } = useAuth();
  return { error, clearError };
};

/**
 * Hook for using sign in functionality
 * @returns The sign in function and loading state
 */
export const useSignIn = () => {
  const { signIn, isLoading } = useAuth();
  return { signIn, isLoading };
};

/**
 * Hook for using sign up functionality
 * @returns The sign up function and loading state
 */
export const useSignUp = () => {
  const { signUp, isLoading } = useAuth();
  return { signUp, isLoading };
};

/**
 * Hook for using sign out functionality
 * @returns The sign out function and loading state
 */
export const useSignOut = () => {
  const { signOut, isLoading } = useAuth();
  return { signOut, isLoading };
};

/**
 * Hook for using social sign in functionality
 * @returns Functions for Google and Apple sign in
 */
export const useSocialSignIn = () => {
  const { signInWithGoogle, signInWithApple, isLoading } = useAuth();
  return { signInWithGoogle, signInWithApple, isLoading };
};
