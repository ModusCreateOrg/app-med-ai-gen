import { useState } from 'react';
import { AuthError } from 'common/models/auth';
import { CognitoUser } from 'common/models/user';
import { DirectCognitoAuthService } from 'common/services/auth/direct-cognito-auth-service';
import { formatAuthError } from 'common/utils/auth-errors';
import { mapCognitoUserToAppUser } from 'common/utils/user-mapper';

// Error message for already signed in user
const ALREADY_SIGNED_IN_ERROR = 'There is already a signed in user';

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
   * @returns Object with alreadySignedIn flag if that error occurs
   */
  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ alreadySignedIn?: boolean }> => {
    setIsLoading(true);
    clearError();

    try {
      await DirectCognitoAuthService.signIn(email, password);
      // Convert the result to the structure expected by mapCognitoUserToAppUser
      const userData = {
        username: email,
        attributes: {
          email,
          given_name: email.split('@')[0] || '', // Use email username as firstName
          // Other attributes would be filled from the session if needed
        },
      };
      const cognitoUser = mapCognitoUserToAppUser(userData);
      setUser(cognitoUser);
      return {}; // Success
    } catch (err) {
      // Check if this is the "already signed in" error
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes(ALREADY_SIGNED_IN_ERROR)) {
        console.log('User is already signed in, getting current user');

        try {
          // Try to get the current user
          const currentUser = await DirectCognitoAuthService.getCurrentUser();
          if (currentUser) {
            // Get tokens to extract user info
            const tokens = DirectCognitoAuthService.getTokens();
            if (tokens?.id_token) {
              // We'll let the AuthProvider handle setting the user from the token
              console.log('Retrieved tokens for already signed in user');
            }
          }
        } catch (innerErr) {
          console.error('Error getting current user after already signed in error:', innerErr);
        }

        return { alreadySignedIn: true };
      }

      // For other errors, set the error state and throw
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
    lastName: string,
  ): Promise<void> => {
    setIsLoading(true);
    clearError();

    try {
      await DirectCognitoAuthService.signUp(email, password, { firstName, lastName });
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
      await DirectCognitoAuthService.confirmSignUp(email, code);
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

    try {
      await DirectCognitoAuthService.resendConfirmationCode(email);
      // Success - code resent to user's email
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
      await DirectCognitoAuthService.signOut();
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
      await DirectCognitoAuthService.federatedSignIn('Google');
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
      await DirectCognitoAuthService.federatedSignIn('SignInWithApple');
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

  /**
   * Initiate password reset flow
   * @param email User's email
   */
  const forgotPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    clearError();

    try {
      await DirectCognitoAuthService.forgotPassword(email);
      // Success - code sent to user's email
    } catch (err) {
      setError(formatAuthError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Confirm password reset with code and set new password
   * @param email User's email
   * @param code Verification code
   * @param newPassword New password
   */
  const confirmResetPassword = async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> => {
    setIsLoading(true);
    clearError();

    try {
      await DirectCognitoAuthService.confirmResetPassword(email, code, newPassword);
      // Success - password reset complete
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
    setUser,
    clearError,
    signIn,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    signOut,
    signInWithGoogle,
    signInWithApple,
    forgotPassword,
    confirmResetPassword,
  };
};
