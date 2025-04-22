import { CognitoUser } from '../models/user';

/**
 * Interface for Cognito user data structure
 */
interface CognitoUserData {
  username: string;
  attributes?: {
    sub?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    email_verified?: string;
    phone_number?: string;
    phone_number_verified?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Maps Cognito user data to the application's CognitoUser model
 * @param cognitoUser Raw Cognito user data
 * @returns Formatted CognitoUser object
 */
export const mapCognitoUserToAppUser = (cognitoUser: CognitoUserData | null): CognitoUser => {
  if (!cognitoUser) {
    // Return a default empty user when input is null
    return {
      id: '',
      username: '',
      email: '',
    };
  }

  // Extract attributes from Cognito user object
  const attributes = cognitoUser.attributes || {};

  // Map the Cognito user to our application user model
  const user: CognitoUser = {
    id: attributes.sub || cognitoUser.username,
    username: cognitoUser.username,
    email: attributes.email || cognitoUser.username,
    firstName: attributes.given_name || '',
    lastName: attributes.family_name || '',
    emailVerified: attributes.email_verified === 'true',
    phone: attributes.phone_number || '',
    phoneVerified: attributes.phone_number_verified === 'true',
  };

  // Set name by combining first and last name if available
  if (user.firstName || user.lastName) {
    user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  return user;
};

/**
 * Extract user groups/roles from Cognito tokens
 * @param idToken ID token from Cognito
 * @returns Array of group names or empty array
 */
export const extractUserGroups = (idToken: string): string[] => {
  if (!idToken) {
    return [];
  }

  try {
    // Decode the JWT token to get the payload
    const payload = JSON.parse(atob(idToken.split('.')[1]));

    // Extract cognito groups from token
    const groups = payload['cognito:groups'] || [];

    return Array.isArray(groups) ? groups : [];
  } catch (error) {
    console.error('Error extracting user groups:', error);
    return [];
  }
};
