import { signIn, signUp, confirmSignUp, signOut, 
  fetchAuthSession, getCurrentUser, resendSignUpCode, signInWithRedirect,
  type AuthUser } from '@aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { amplifyConfig } from '../../config/aws-config';
import { UserTokens } from '../../models/auth';
import { AuthProvider } from '@aws-amplify/auth/dist/esm/types/inputs';

// Provider enum for OAuth
enum OAuthProvider {
  Google = 'Google',
  Apple = 'Apple'
}

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
   * Resend confirmation code to the user's email
   * @param username Email address
   * @returns Promise resolving when the code is sent
   */
  static async resendConfirmationCode(username: string) {
    try {
      return await resendSignUpCode({ username });
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
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      return await getCurrentUser();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Not throwing here as this is often used to check if a user is signed in
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return null;
    }
  }

  /**
   * Initiate social sign in (Google or Apple)
   * @param provider 'Google' or 'SignInWithApple'
   * @returns Promise resolving to void (redirects to the IdP)
   */
  static async federatedSignIn(provider: 'Google' | 'SignInWithApple'): Promise<void> {
    try {
      // Map our provider names to Cognito's provider identifiers
      const providerMap: Record<string, string> = {
        'Google': OAuthProvider.Google,
        'SignInWithApple': OAuthProvider.Apple
      };
      
      // Get the OAuth provider
      const oauthProvider = providerMap[provider];
      if (!oauthProvider) {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      
      // Initiate the OAuth redirect flow
      await signInWithRedirect({ provider: oauthProvider as AuthProvider });
      
      // This function will redirect the browser and not return
      // The user will be redirected back to the app after authentication
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