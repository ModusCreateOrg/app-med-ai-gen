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
  // App URLs for OAuth redirects
  localRedirectSignIn: import.meta.env.VITE_REDIRECT_SIGN_IN || 'http://localhost:3000/',
  localRedirectSignOut: import.meta.env.VITE_REDIRECT_SIGN_OUT || 'http://localhost:3000/',
  
  // For deployed environments, these would be different URLs
  hostedRedirectSignIn: import.meta.env.VITE_HOSTED_REDIRECT_SIGN_IN || 'https://yourapp.com/',
  hostedRedirectSignOut: import.meta.env.VITE_HOSTED_REDIRECT_SIGN_OUT || 'https://yourapp.com/',
};

/**
 * Auth/Cognito Configuration
 */
export const COGNITO_CONFIG = {
  // User Pool
  USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_xxxxxxxx', // Replace with your User Pool ID
  USER_POOL_WEB_CLIENT_ID: import.meta.env.VITE_COGNITO_APP_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with your App Client ID
  IDENTITY_POOL_ID: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
  // OAuth Configuration (for Social Login)
  OAUTH_DOMAIN: import.meta.env.VITE_COGNITO_DOMAIN || 'your-domain.auth.us-east-1.amazoncognito.com', // Replace with your Cognito domain
  OAUTH_SCOPES: ['email', 'profile', 'openid'],
  
  // Auth mechanisms
  AUTH_MECHANISMS: ['EMAIL'],
  
  // Social providers
  SOCIAL_PROVIDERS: ['Google', 'SignInWithApple'],
};

/**
 * Get redirect URLs for OAuth based on the environment
 * In development, we use localhost, in production we use the hosted URLs
 */
const redirectUrls = {
  // For local development
  signIn: [APP_CONFIG.localRedirectSignIn],
  signOut: [APP_CONFIG.localRedirectSignOut],
};

// If we're in a production-like environment, add the hosted URLs
if (import.meta.env.PROD) {
  redirectUrls.signIn.push(APP_CONFIG.hostedRedirectSignIn);
  redirectUrls.signOut.push(APP_CONFIG.hostedRedirectSignOut);
}

/**
 * Amplify Configuration object for initializing Amplify (V6 format)
 */
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: COGNITO_CONFIG.USER_POOL_ID,
      userPoolClientId: COGNITO_CONFIG.USER_POOL_WEB_CLIENT_ID,
      identityPoolId: COGNITO_CONFIG.IDENTITY_POOL_ID,
      loginWith: {
        email: true,
        phone: false,
        username: false,
        oauth: {
          domain: COGNITO_CONFIG.OAUTH_DOMAIN,
          scopes: COGNITO_CONFIG.OAUTH_SCOPES,
          redirectSignIn: redirectUrls.signIn,
          redirectSignOut: redirectUrls.signOut,
          responseType: 'code' as const
        }
      }
    }
  },
  // Configure only the region you need to use
  region: REGION
}; 