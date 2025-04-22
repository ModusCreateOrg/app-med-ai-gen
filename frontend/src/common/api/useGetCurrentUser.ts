import { useQuery } from '@tanstack/react-query';

import { CognitoUser } from 'common/models/user';
import { QueryKey } from 'common/utils/constants';
import CognitoAuthService from 'common/services/auth/cognito-auth-service';
import { mapCognitoUserToAppUser } from 'common/utils/user-mapper';

/**
 * An API hook which fetches the currently authenticated user from Cognito.
 * @returns Returns a `UseQueryResult` with `CognitoUser` data.
 */
export const useGetCurrentUser = () => {
  /**
   * Fetch the details about the currently authenticated user.
   * @returns A Promise which resolves to a `CognitoUser`.
   */
  const getCurentUser = async (): Promise<CognitoUser> => {
    try {
      // Get current user from Cognito
      const cognitoUser = await CognitoAuthService.getCurrentUser();

      if (!cognitoUser) {
        throw new Error('User not found');
      }

      // Map Cognito user data to our application's user model
      const userData = {
        username: cognitoUser.username || '',
        attributes: {
          // Extract whatever attributes are available from the user object
          email: cognitoUser.signInDetails?.loginId || '',
        },
      };

      return mapCognitoUserToAppUser(userData);
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  };

  return useQuery({
    queryKey: [QueryKey.Users, 'current'],
    queryFn: () => getCurentUser(),
  });
};
