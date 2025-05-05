import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  RevokeTokenCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
  ForgotPasswordCommandOutput,
  ConfirmForgotPasswordCommandOutput,
  SignUpCommandOutput,
  ConfirmSignUpCommandOutput,
  ResendConfirmationCodeCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
} from '@aws-sdk/client-cognito-identity';
import { COGNITO_CONFIG, REGION } from '../../config/aws-config';
import { UserTokens } from '../../models/auth';
import { CognitoUser } from '../../models/user';

// Define AWS credentials interface
interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

// Define session interface
interface CognitoSession {
  tokens: UserTokens | null;
  isValid: boolean;
}

/**
 * Direct Cognito Authentication Service
 *
 * A service to handle interactions with AWS Cognito directly using the AWS SDK
 * without relying on AWS Amplify
 */
export class DirectCognitoAuthService {
  private static client = new CognitoIdentityProviderClient({ region: 'us-east-1' });
  private static identityClient = new CognitoIdentityClient({ region: REGION });
  private static clientId = COGNITO_CONFIG.USER_POOL_WEB_CLIENT_ID;
  private static userPoolId = COGNITO_CONFIG.USER_POOL_ID;

  /**
   * Sign in with email and password
   * @param username Email address
   * @param password Password
   * @returns Promise resolving to the authenticated user tokens
   */
  static async signIn(username: string, password: string): Promise<UserTokens> {
    try {
      const params = {
        AuthFlow: 'USER_PASSWORD_AUTH' as AuthFlowType,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      };

      const command = new InitiateAuthCommand(params);
      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed - no auth result');
      }

      const { IdToken, AccessToken, RefreshToken, ExpiresIn } = response.AuthenticationResult;

      if (!IdToken || !AccessToken) {
        throw new Error('Authentication failed - missing tokens');
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (ExpiresIn || 3600) * 1000).toISOString();

      // Store tokens in localStorage
      localStorage.setItem('cognito_id_token', IdToken);
      localStorage.setItem('cognito_access_token', AccessToken);
      if (RefreshToken) {
        localStorage.setItem('cognito_refresh_token', RefreshToken);
      }

      return {
        id_token: IdToken,
        access_token: AccessToken,
        refresh_token: RefreshToken || '',
        token_type: 'bearer',
        expires_in: ExpiresIn || 3600,
        expires_at: expiresAt,
      };
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Sign up a new user
   * @param username Email address
   * @param password Password
   * @param attributes User attributes (first name, last name, etc.)
   * @returns Promise resolving to sign up response
   */
  static async signUp(
    username: string,
    password: string,
    attributes: { firstName: string; lastName: string },
  ): Promise<SignUpCommandOutput> {
    try {
      const params = {
        ClientId: this.clientId,
        Username: username,
        Password: password,
        UserAttributes: [
          {
            Name: 'email',
            Value: username,
          },
          {
            Name: 'given_name',
            Value: attributes.firstName,
          },
          {
            Name: 'family_name',
            Value: attributes.lastName,
          },
        ],
      };

      const command = new SignUpCommand(params);
      return await this.client.send(command);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  /**
   * Confirm sign up with verification code
   * @param username Email address
   * @param code Verification code
   * @returns Promise resolving to confirmation result
   */
  static async confirmSignUp(username: string, code: string): Promise<ConfirmSignUpCommandOutput> {
    try {
      const params = {
        ClientId: this.clientId,
        Username: username,
        ConfirmationCode: code,
      };

      const command = new ConfirmSignUpCommand(params);
      return await this.client.send(command);
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  }

  /**
   * Resend confirmation code to the user's email
   * @param username Email address
   * @returns Promise resolving when the code is sent
   */
  static async resendConfirmationCode(
    username: string,
  ): Promise<ResendConfirmationCodeCommandOutput> {
    try {
      const params = {
        ClientId: this.clientId,
        Username: username,
      };

      const command = new ResendConfirmationCodeCommand(params);
      return await this.client.send(command);
    } catch (error) {
      console.error('Error resending confirmation code:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @returns Promise resolving when sign out is complete
   */
  static async signOut(): Promise<void> {
    try {
      const tokens = this.getTokens();
      if (tokens && tokens.access_token) {
        // Revoke the refresh token if available
        if (tokens.refresh_token) {
          const revokeParams = {
            ClientId: this.clientId,
            Token: tokens.refresh_token,
          };
          const revokeCommand = new RevokeTokenCommand(revokeParams);
          await this.client.send(revokeCommand);
        }

        // Sign out globally to invalidate all sessions
        const signOutParams = {
          AccessToken: tokens.access_token,
        };
        const signOutCommand = new GlobalSignOutCommand(signOutParams);
        await this.client.send(signOutCommand);
      }

      // Clear local storage regardless of API success
      localStorage.removeItem('cognito_id_token');
      localStorage.removeItem('cognito_access_token');
      localStorage.removeItem('cognito_refresh_token');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local storage on error
      localStorage.removeItem('cognito_id_token');
      localStorage.removeItem('cognito_access_token');
      localStorage.removeItem('cognito_refresh_token');
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * @returns Promise resolving to the current authenticated user
   */
  static async getCurrentUser(): Promise<{
    username: string;
    attributes: Record<string, string>;
    userId: string;
  } | null> {
    try {
      const tokens = this.getTokens();
      if (!tokens || !tokens.access_token) {
        return null;
      }

      const params = {
        AccessToken: tokens.access_token,
      };

      const command = new GetUserCommand(params);
      const response = await this.client.send(command);

      // Transform the response into a format similar to what Amplify would return
      const attributes = {} as Record<string, string>;

      if (response.UserAttributes) {
        response.UserAttributes.forEach((attr) => {
          if (attr.Name && attr.Value) {
            attributes[attr.Name] = attr.Value;
          }
        });
      }

      return {
        username: response.Username || '',
        attributes,
        userId: attributes.sub,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get session tokens
   * @returns Current tokens or null if not available
   */
  static getTokens(): UserTokens | null {
    const idToken = localStorage.getItem('cognito_id_token');
    const accessToken = localStorage.getItem('cognito_access_token');
    const refreshToken = localStorage.getItem('cognito_refresh_token');

    if (!idToken || !accessToken) {
      return null;
    }

    // Try to extract expiration time from the ID token
    let expiresIn = 0;
    let expiresAt = '';
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      if (payload.exp) {
        // exp is in seconds since epoch
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        expiresIn = Math.max(0, Math.floor((expirationTime - Date.now()) / 1000));
        expiresAt = new Date(expirationTime).toISOString();
      }
    } catch (error) {
      console.warn('Error parsing ID token expiration:', error);
    }

    return {
      id_token: idToken,
      access_token: accessToken,
      refresh_token: refreshToken || '',
      token_type: 'bearer',
      expires_in: expiresIn,
      expires_at: expiresAt,
    };
  }

  /**
   * Get user info from tokens
   * @returns User info extracted from ID token
   */
  static getUserInfoFromToken(): CognitoUser | null {
    const idToken = localStorage.getItem('cognito_id_token');
    if (!idToken) return null;

    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));

      return {
        id: payload.sub,
        username: payload.email || '',
        email: payload.email || '',
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        emailVerified: payload.email_verified || false,
        groups: payload['cognito:groups'] || [],
      };
    } catch (error) {
      console.error('Error parsing ID token:', error);
      return null;
    }
  }

  /**
   * Initiate password reset flow by sending a code to the user's email
   * @param username Email address
   * @returns Promise resolving when the code is sent
   */
  static async forgotPassword(username: string): Promise<ForgotPasswordCommandOutput> {
    try {
      const params = {
        ClientId: this.clientId,
        Username: username,
      };

      const command = new ForgotPasswordCommand(params);
      return await this.client.send(command);
    } catch (error) {
      console.error('Error initiating password reset:', error);
      throw error;
    }
  }

  /**
   * Complete password reset with verification code and new password
   * @param username Email address
   * @param code Verification code
   * @param newPassword New password
   * @returns Promise resolving when password is reset
   */
  static async confirmResetPassword(
    username: string,
    code: string,
    newPassword: string,
  ): Promise<ConfirmForgotPasswordCommandOutput> {
    try {
      const params = {
        ClientId: this.clientId,
        Username: username,
        ConfirmationCode: code,
        Password: newPassword,
      };

      const command = new ConfirmForgotPasswordCommand(params);
      return await this.client.send(command);
    } catch (error) {
      console.error('Error confirming password reset:', error);
      throw error;
    }
  }

  /**
   * Initiate federated sign-in (social login) with a third-party provider
   * @param provider 'Google' or 'SignInWithApple'
   * @returns Promise resolving to void (redirects to the IdP)
   */
  static async federatedSignIn(provider: 'Google' | 'SignInWithApple'): Promise<void> {
    try {
      // Get the Cognito domain from config
      const domain = COGNITO_CONFIG.OAUTH_DOMAIN;
      if (!domain) {
        throw new Error('OAuth domain is not configured');
      }

      // Get the client ID
      const clientId = this.clientId;

      // Get the redirect URL
      const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback');

      // Map provider to identity provider name used by Cognito
      const idpName = provider === 'Google' ? 'Google' : 'SignInWithApple';

      // Construct the authorization URL
      let authorizationUrl = `https://${domain}/oauth2/authorize?`;
      authorizationUrl += `identity_provider=${idpName}`;
      authorizationUrl += `&redirect_uri=${redirectUri}`;
      authorizationUrl += `&response_type=code`;
      authorizationUrl += `&client_id=${clientId}`;

      // Add scopes
      const scopes = COGNITO_CONFIG.OAUTH_SCOPES || ['email', 'profile', 'openid'];
      authorizationUrl += `&scope=${encodeURIComponent(scopes.join(' '))}`;

      // Optional: Add state parameter for security (anti-CSRF)
      const state = Math.random().toString(36).substring(2);
      localStorage.setItem('oauth_state', state);
      authorizationUrl += `&state=${state}`;

      // Redirect to the authorization URL
      window.location.href = authorizationUrl;
    } catch (error) {
      console.error('Error initiating federated sign-in:', error);
      throw error;
    }
  }

  /**
   * Check if tokens need refresh
   * @param tokens Current tokens
   * @returns Boolean indicating if refresh is needed
   */
  private static isTokenRefreshNeeded(tokens: UserTokens): boolean {
    // If we don't have a refresh token, we can't refresh
    if (!tokens.refresh_token) {
      return false;
    }

    // Check if token is expired or about to expire (within 10 minutes)
    const expTime = tokens.expires_at ? new Date(tokens.expires_at).getTime() : 0;
    const isExpired = expTime > 0 && expTime <= Date.now();
    const isExpiringSoon = expTime > 0 && expTime - Date.now() < 10 * 60 * 1000;

    return isExpired || isExpiringSoon;
  }

  /**
   * Perform the token refresh API call
   * @param refreshToken The refresh token to use
   * @returns The new tokens or null if refresh failed
   */
  private static async performTokenRefresh(refreshToken: string): Promise<{
    IdToken: string;
    AccessToken: string;
    ExpiresIn: number;
  } | null> {
    try {
      const refreshParams = {
        AuthFlow: 'REFRESH_TOKEN_AUTH' as AuthFlowType,
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      };

      const refreshCommand = new InitiateAuthCommand(refreshParams);
      const refreshResponse = await this.client.send(refreshCommand);

      if (!refreshResponse.AuthenticationResult) {
        console.warn('Token refresh did not return authentication result');
        return null;
      }

      const { IdToken, AccessToken, ExpiresIn } = refreshResponse.AuthenticationResult;

      if (!IdToken || !AccessToken) {
        console.warn('Token refresh missing ID or Access token');
        return null;
      }

      return {
        IdToken,
        AccessToken,
        ExpiresIn: ExpiresIn || 3600,
      };
    } catch (error) {
      console.warn('Token refresh failed:', error);

      // Check for invalid refresh token
      if (
        error instanceof Error &&
        (error.name === 'NotAuthorizedException' || error.message.includes('Invalid refresh token'))
      ) {
        console.warn('Clearing invalid refresh token');
        localStorage.removeItem('cognito_refresh_token');
      }

      return null;
    }
  }

  /**
   * Update local tokens with refreshed values
   * @param tokens Original tokens
   * @param newTokens New token values
   * @returns Updated UserTokens object
   */
  private static updateTokensWithRefreshed(
    tokens: UserTokens,
    newTokens: { IdToken: string; AccessToken: string; ExpiresIn: number },
  ): UserTokens {
    const { IdToken, AccessToken, ExpiresIn } = newTokens;

    // Calculate new expiration time
    const expiresAt = new Date(Date.now() + ExpiresIn * 1000).toISOString();
    console.log('Tokens refreshed successfully, new expiration:', expiresAt);

    // Update tokens in local storage
    localStorage.setItem('cognito_id_token', IdToken);
    localStorage.setItem('cognito_access_token', AccessToken);

    // Return updated tokens
    return {
      ...tokens,
      id_token: IdToken,
      access_token: AccessToken,
      expires_in: ExpiresIn,
      expires_at: expiresAt,
    };
  }

  /**
   * Refreshes the token using the refresh token if available
   * @param tokens Current tokens
   * @returns Updated tokens if refresh succeeded, original tokens otherwise
   */
  private static async refreshTokensIfNeeded(tokens: UserTokens): Promise<UserTokens> {
    // Check if token needs refresh
    if (!this.isTokenRefreshNeeded(tokens)) {
      return tokens;
    }

    console.log('Refreshing tokens - current token expires at:', tokens.expires_at);

    // Perform token refresh
    const refreshedTokens = await this.performTokenRefresh(tokens.refresh_token);

    // If refresh failed, return original tokens
    if (!refreshedTokens) {
      return tokens;
    }

    // Update and return the refreshed tokens
    return this.updateTokensWithRefreshed(tokens, refreshedTokens);
  }

  /**
   * Get Cognito Identity ID
   * @param tokens User tokens
   * @returns The Identity ID
   */
  private static async getIdentityId(tokens: UserTokens): Promise<string> {
    const identityPoolId = COGNITO_CONFIG.IDENTITY_POOL_ID;

    if (!identityPoolId) {
      throw new Error('Identity Pool ID is not configured');
    }

    const getIdParams = {
      IdentityPoolId: identityPoolId,
      Logins: {
        [`cognito-idp.${REGION}.amazonaws.com/${this.userPoolId}`]: tokens.id_token,
      },
    };

    const getIdCommand = new GetIdCommand(getIdParams);
    const identityResponse = await this.identityClient.send(getIdCommand);

    if (!identityResponse.IdentityId) {
      throw new Error('Failed to obtain identity ID');
    }

    return identityResponse.IdentityId;
  }

  /**
   * Get AWS credentials using Identity ID
   * @param identityId The Identity ID
   * @param idToken The ID token
   * @returns AWS credentials
   */
  private static async getAWSCredentials(
    identityId: string,
    idToken: string,
  ): Promise<AWSCredentials> {
    const credentialsParams = {
      IdentityId: identityId,
      Logins: {
        [`cognito-idp.${REGION}.amazonaws.com/${this.userPoolId}`]: idToken,
      },
    };

    const credentialsCommand = new GetCredentialsForIdentityCommand(credentialsParams);
    const credentialsResponse = await this.identityClient.send(credentialsCommand);

    if (!credentialsResponse.Credentials) {
      throw new Error('Failed to obtain AWS credentials');
    }

    const { AccessKeyId, SecretKey, SessionToken, Expiration } = credentialsResponse.Credentials;

    if (!AccessKeyId || !SecretKey || !SessionToken || !Expiration) {
      throw new Error('Incomplete AWS credentials received');
    }

    return {
      accessKeyId: AccessKeyId,
      secretAccessKey: SecretKey,
      sessionToken: SessionToken,
      expiration: Expiration,
    };
  }

  /**
   * Fetches the current authentication session, including AWS credentials
   * @returns Promise with session information including credentials
   */
  static async fetchAuthSession(): Promise<{ credentials: AWSCredentials }> {
    try {
      // Get the current tokens
      const tokens = this.getTokens();
      if (!tokens || !tokens.id_token) {
        throw new Error('No active session found');
      }

      // Check for expired token
      if (tokens.expires_at) {
        const expTime = new Date(tokens.expires_at).getTime();
        if (expTime <= Date.now()) {
          console.warn('Token is expired, attempting to refresh');
        }
      }

      // Always try to refresh tokens
      const refreshedTokens = await this.refreshTokensIfNeeded(tokens);

      try {
        // Get identity ID
        const identityId = await this.getIdentityId(refreshedTokens);

        // Get AWS credentials
        const credentials = await this.getAWSCredentials(identityId, refreshedTokens.id_token);

        return { credentials };
      } catch (credentialError) {
        console.error('Error getting credentials:', credentialError);

        // If we get authentication errors, force token refresh one more time
        if (
          credentialError instanceof Error &&
          (credentialError.name === 'NotAuthorizedException' ||
            credentialError.message.includes('Invalid login token') ||
            credentialError.message.includes('Token expired'))
        ) {
          console.warn('Auth error detected, forcing token refresh');

          // Force a refresh by simulating an expired token
          const forcedRefreshTokens = {
            ...refreshedTokens,
            expires_at: new Date(Date.now() - 1000).toISOString(),
          };

          // Try one more refresh
          const finalTokens = await this.refreshTokensIfNeeded(forcedRefreshTokens);

          // Try again with refreshed tokens
          const identityId = await this.getIdentityId(finalTokens);
          const credentials = await this.getAWSCredentials(identityId, finalTokens.id_token);

          return { credentials };
        }

        // Re-throw other errors
        throw credentialError;
      }
    } catch (error) {
      console.error('Error fetching auth session:', error);

      // If we still have auth errors after all attempts, try to sign the user out
      // to force a fresh login on next attempt
      if (
        error instanceof Error &&
        (error.name === 'NotAuthorizedException' ||
          error.message.includes('Invalid login token') ||
          error.message.includes('Token expired'))
      ) {
        console.warn('Authentication failed completely, clearing local session');
        localStorage.removeItem('cognito_id_token');
        localStorage.removeItem('cognito_access_token');
        localStorage.removeItem('cognito_refresh_token');
      }

      throw new Error(
        'Failed to get authentication session: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /**
   * Get current session information
   * @returns Promise resolving to the current session
   */
  static async getCurrentSession(): Promise<CognitoSession> {
    try {
      const tokens = this.getTokens();

      if (!tokens) {
        return {
          tokens: null,
          isValid: false,
        };
      }

      // Check if token is expired
      const isValid = tokens.expires_at ? new Date(tokens.expires_at).getTime() > Date.now() : true; // If we don't have expires_at, assume it's valid and let API calls fail if needed

      return {
        tokens,
        isValid,
      };
    } catch (error) {
      console.error('Error getting current session:', error);
      return {
        tokens: null,
        isValid: false,
      };
    }
  }
}

/**
 * Export singleton instance for easy imports
 */
export default DirectCognitoAuthService;
