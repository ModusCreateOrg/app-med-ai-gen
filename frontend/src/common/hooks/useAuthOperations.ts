import { useState } from 'react';
import { AuthError } from 'common/models/auth';
import { CognitoUser } from 'common/models/user';
import CognitoAuthService from 'common/services/auth/cognito-auth-service';
import { formatAuthError } from 'common/utils/auth-errors';
import { mapCognitoUserToAppUser } from 'common/utils/user-mapper';

/**
 * Hook for authentication operations
 * @returns Authentication methods and state
 */
export const useAuthOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | undefined>(undefined);
  const [user, setUser] = useState<CognitoUser | undefined>(undefined);

  /**
   * Clear any authentication errors
   */
  const clearError = () => setError(undefined);

  /**
   * Sign in with email and password
   * @param email User's email
   * @param password User's password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      await CognitoAuthService.signIn(email, password);
      // Convert the result to the structure expected by mapCognitoUserToAppUser
      const userData = {
        username: email,
        attributes: {
          email,
          // Other attributes would be filled from the session if needed
        }
      };
      const cognitoUser = mapCognitoUserToAppUser(userData);
      setUser(cognitoUser);
    } catch (err) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up a new user
   * @param email User's email
   * @param password User's password
   * @param firstName User's first name
   * @param lastName User's last name
   */
  const signUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      await CognitoAuthService.signUp(email, password, { firstName, lastName });
      // Don't set the user yet - confirmation is required first
    } catch (err) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Confirm a user's sign up with verification code
   * @param email User's email
   * @param code Verification code
   */
  const confirmSignUp = async (email: string, code: string): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      await CognitoAuthService.confirmSignUp(email, code);
      // User confirmed, but not yet signed in
    } catch (err) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend confirmation code to user's email
   * @param email User's email
   */
  const resendConfirmationCode = async (email: string): Promise<void> => {
    setIsLoading(true);
    clearError();
    console.log('resendConfirmationCode', email);
    
    try {
      // This would need to be implemented in the Cognito service
      // For now, we'll throw an error
      throw new Error('Not implemented');
    } catch (err) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      await CognitoAuthService.signOut();
      setUser(undefined);
    } catch (err) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      await CognitoAuthService.federatedSignIn('Google');
      // Note: This doesn't complete the sign-in flow.
      // The user will be redirected to Google and then back to your app
      // Your app needs to handle the redirect URI
    } catch (err) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Apple
   */
  const signInWithApple = async (): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      await CognitoAuthService.federatedSignIn('SignInWithApple');
      // Note: This doesn't complete the sign-in flow.
      // The user will be redirected to Apple and then back to your app
      // Your app needs to handle the redirect URI
    } catch (err) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    user,
    clearError,
    signIn,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    signOut,
    signInWithGoogle,
    signInWithApple,
  };
}; 