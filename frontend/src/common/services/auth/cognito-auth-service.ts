import { signIn, signUp, confirmSignUp, signOut, 
  fetchAuthSession, getCurrentUser } from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { amplifyConfig } from '../../config/aws-config';
import { UserTokens } from '../../models/auth';

/**
 * Initialize AWS Amplify with the configuration
 */
Amplify.configure(amplifyConfig);

/**
 * Cognito Authentication Service
 * 
 * A service to handle interactions with AWS Cognito for authentication and user management
 */
export class CognitoAuthService {

  /**
   * Sign in with email and password
   * @param username Email address
   * @param password Password
   * @returns Promise resolving to the authenticated user
   */
  static async signIn(username: string, password: string) {
    try {
      const user = await signIn({ username, password });
      return user;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Sign up a new user
   * @param email User's email
   * @param password User's password
   * @param attributes User attributes (first name, last name)
   * @returns Promise resolving to the sign up result
   */
  static async signUp(email: string, password: string, attributes: { firstName: string; lastName: string }) {
    try {
      const result = await signUp({
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
      return result;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Confirm sign up with verification code
   * @param username Email address
   * @param code Verification code
   * @returns Promise resolving to the confirmation result
   */
  static async confirmSignUp(username: string, code: string) {
    try {
      return await confirmSignUp({ username, confirmationCode: code });
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @returns Promise resolving when sign out is complete
   */
  static async signOut() {
    try {
      return await signOut();
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * @returns Promise resolving to the current authenticated user
   */
  static async getCurrentUser() {
    try {
      return await getCurrentUser();
    } catch (_error) {
      // Not throwing here as this is often used to check if a user is signed in
      console.error('Error getting current user:', _error);
      return null;
    }
  }

  /**
   * Get current session
   * @returns Promise resolving to the current session
   */
  static async getCurrentSession() {
    try {
      return await fetchAuthSession();
    } catch (_error) {
      console.error('Error getting current session:', _error);
      return null;
    }
  }

  /**
   * Get user tokens from the current session
   * @returns Promise resolving to UserTokens or null if no session
   */
  static async getUserTokens(): Promise<UserTokens | null> {
    try {
      const session = await fetchAuthSession();
      
      if (!session.tokens || !session.tokens.accessToken || !session.tokens.idToken) {
        return null;
      }
      
      // Get expiration time from access token
      const accessToken = session.tokens.accessToken;
      const expirationTime = accessToken.payload.exp ?? 0;
      
      return {
        access_token: accessToken.toString(),
        id_token: session.tokens.idToken.toString(),
        refresh_token: '', // AWS Amplify v6 doesn't expose refresh token directly
        token_type: 'bearer',
        expires_in: Math.floor((new Date(expirationTime * 1000).getTime() - Date.now()) / 1000),
        expires_at: new Date(expirationTime * 1000).toISOString(),
      };
    } catch (_error) {
      this.handleAuthError(_error);
      return null;
    }
  }

  /**
   * Initiate social sign in (Google or Apple)
   * @param provider 'Google' or 'SignInWithApple'
   * @returns Promise
   */
  static async federatedSignIn(provider: 'Google' | 'SignInWithApple') {
    try {
      // This needs OAuth configuration in the Amplify setup
      // In AWS Amplify v6, we'd use a different approach for federated sign in
      // Placeholder for now
      console.warn('federatedSignIn is not implemented in this version', provider);
      // In production, federated sign-in would be handled differently
      // For example, using a hosted UI or custom implementation
      return null;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Handle common authentication errors
   * @param error The error from Cognito
   */
  private static handleAuthError(error: unknown) {
    // Log the error for debugging
    console.error('Authentication error:', error);
    
    // You can add custom error handling logic here
    // For example, mapping Cognito error codes to user-friendly messages
  }
}

/**
 * Export singleton instance for easy imports
 */
export default CognitoAuthService; 