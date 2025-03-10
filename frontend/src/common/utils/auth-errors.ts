import { AuthError } from '../models/auth';

/**
 * Map of error codes to user-friendly error messages
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Sign In errors
  'UserNotFoundException': 'The email address or password you entered is incorrect.',
  'NotAuthorizedException': 'The email address or password you entered is incorrect.',
  'UserNotConfirmedException': 'Please check your email to verify your account.',
  'PasswordResetRequiredException': 'You need to reset your password. Please check your email.',
  
  // Sign Up errors
  'UsernameExistsException': 'This email address is already associated with an account. Please sign in or reset your password.',
  'InvalidPasswordException': 'Password does not meet the requirements. Please use a stronger password.',
  'InvalidParameterException': 'Please check your input and try again.',
  
  // Verification errors
  'CodeMismatchException': 'The verification code is incorrect. Please try again.',
  'ExpiredCodeException': 'The verification code has expired. Please request a new one.',
  
  // General errors
  'LimitExceededException': 'Too many attempts. Please try again later.',
  'TooManyRequestsException': 'Too many requests. Please try again later.',
  'InternalErrorException': 'An unexpected error occurred. Please try again later.',
  'ServiceUnavailableException': 'The service is temporarily unavailable. Please try again later.',
  
  // Default error
  'default': 'An error occurred during authentication. Please try again.'
};

/**
 * Error object interface for consistent error handling
 */
interface ErrorWithCode {
  code?: string;
  name?: string;
  message?: string;
}

/**
 * Get a user-friendly error message for an authentication error
 * @param error The authentication error
 * @returns A user-friendly error message
 */
export const getAuthErrorMessage = (error: ErrorWithCode | unknown): string => {
  if (!error) return AUTH_ERROR_MESSAGES.default;
  
  // Type guard to check if error is ErrorWithCode
  const errorWithCode = error as ErrorWithCode;
  const errorCode = errorWithCode.code || (errorWithCode.name || '');
  
  return AUTH_ERROR_MESSAGES[errorCode] || errorWithCode.message || AUTH_ERROR_MESSAGES.default;
};

/**
 * Format an authentication error for consistent handling
 * @param error The authentication error
 * @returns A standardized AuthError object
 */
export const formatAuthError = (error: ErrorWithCode | unknown): AuthError => {
  const errorWithCode = error as ErrorWithCode;
  
  return {
    code: errorWithCode.code || (errorWithCode.name || 'UnknownError'),
    message: getAuthErrorMessage(error),
    name: errorWithCode.name || 'Error'
  };
}; 