/**
 * AWS Configuration for the application
 * 
 * This file contains configuration settings for AWS services including Cognito User Pool.
 * In a production environment, these values should come from environment variables.
 */

export const REGION = 'us-east-1'; // Replace with your AWS region

/**
 * Cognito Configuration
 */
export const COGNITO_CONFIG = {
  // User Pool
  USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_xxxxxxxx', // Replace with your User Pool ID
  USER_POOL_WEB_CLIENT_ID: import.meta.env.VITE_COGNITO_APP_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with your App Client ID
  
  // OAuth Configuration (for Social Login)
  OAUTH: {
    domain: import.meta.env.VITE_COGNITO_DOMAIN || 'your-domain.auth.us-east-1.amazoncognito.com', // Replace with your Cognito domain
    scope: ['email', 'profile', 'openid'],
    redirectSignIn: import.meta.env.VITE_REDIRECT_SIGN_IN || 'http://localhost:3000/',
    redirectSignOut: import.meta.env.VITE_REDIRECT_SIGN_OUT || 'http://localhost:3000/',
    responseType: 'code' as const
  },
  
  // Auth mechanisms
  AUTH_MECHANISMS: ['EMAIL'],
  
  // Social providers
  SOCIAL_PROVIDERS: ['Google', 'SignInWithApple'],
};

/**
 * Amplify Configuration object for initializing Amplify (V6 format)
 */
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: COGNITO_CONFIG.USER_POOL_ID,
      userPoolClientId: COGNITO_CONFIG.USER_POOL_WEB_CLIENT_ID,
      loginWith: {
        email: true,
        phone: false,
        username: false,
        oauth: {
          domain: COGNITO_CONFIG.OAUTH.domain,
          scopes: COGNITO_CONFIG.OAUTH.scope,
          redirectSignIn: [COGNITO_CONFIG.OAUTH.redirectSignIn],
          redirectSignOut: [COGNITO_CONFIG.OAUTH.redirectSignOut],
          responseType: 'code' as const
        }
      }
    }
  },
  // Configure only the region you need to use
  region: REGION
}; 