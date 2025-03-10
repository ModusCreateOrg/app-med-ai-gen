/**
 * The `UserTokens` type. Authenticated user tokens.
 */
export type UserTokens = {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  expires_at: string;
};

/**
 * The `RememberMe` type. Saved sign in attributes.
 */
export type RememberMe = {
  username: string;
};

/**
 * The `CognitoUserAttributes` type. Cognito user attributes.
 */
export type CognitoUserAttributes = {
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  sub?: string;
};

/**
 * The `AuthError` type. Authentication error details.
 */
export type AuthError = {
  code: string;
  message: string;
  name: string;
};

/**
 * The `SignUpParams` type. Parameters for user registration.
 */
export type SignUpParams = {
  username: string;
  password: string;
  attributes: {
    email: string;
    given_name: string;
    family_name: string;
  };
};

/**
 * Social authentication providers
 */
export enum SocialAuthProvider {
  GOOGLE = 'Google',
  APPLE = 'SignInWithApple',
}

/**
 * The `AuthState` type. Current auth state.
 */
export enum AuthState {
  SIGNED_IN = 'signedIn',
  SIGNED_OUT = 'signedOut',
}
