/**
 * AWS Configuration for the application
 *
 * This file contains configuration settings for AWS services including Cognito User Pool.
 * In a production environment, these values should come from environment variables.
 */

export const REGION = 'us-east-1'; // Replace with your AWS region

/**
 * App configuration
 */
export const APP_CONFIG = {
  hostedRedirectSignIn: import.meta.env.VITE_HOSTED_REDIRECT_SIGN_IN,
  hostedRedirectSignOut: import.meta.env.VITE_HOSTED_REDIRECT_SIGN_OUT,
};

/**
 * S3 Configuration
 */
export const S3_CONFIG = {
  BUCKET: import.meta.env.VITE_S3_BUCKET_NAME || 'aimedicalreport-uploads-development-841162674562',
  REGION: REGION,
};

/**
 * Auth/Cognito Configuration
 */
export const COGNITO_CONFIG = {
  // User Pool
  USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  USER_POOL_WEB_CLIENT_ID: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
  IDENTITY_POOL_ID: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
  // OAuth Configuration (for Social Login)
  OAUTH_DOMAIN: import.meta.env.VITE_COGNITO_DOMAIN,
  OAUTH_SCOPES: ['email', 'profile', 'openid'],

  // Auth mechanisms
  AUTH_MECHANISMS: ['EMAIL'],

  // Social providers
  SOCIAL_PROVIDERS: ['Google', 'SignInWithApple'],
};
