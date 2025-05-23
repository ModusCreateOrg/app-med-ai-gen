import { useQuery } from '@tanstack/react-query';

import { UserTokens } from 'common/models/auth';
import { QueryKey } from 'common/utils/constants';
import { DirectCognitoAuthService } from 'common/services/auth/direct-cognito-auth-service';

/**
 * An API hook which fetches tokens from AWS Cognito.
 * @returns Returns a `UseQueryResult` with `UserTokens` data.
 */
export const useGetUserTokens = () => {
  const getUserTokens = async (): Promise<UserTokens> => {
    try {
      // Get tokens directly from DirectCognitoAuthService
      const tokens = DirectCognitoAuthService.getTokens();

      if (!tokens) {
        throw new Error('Tokens not found.');
      }

      return tokens;
    } catch (error) {
      console.error('Error getting user tokens:', error);
      throw error;
    }
  };

  return useQuery({
    queryKey: [QueryKey.UserTokens],
    queryFn: () => getUserTokens(),
    retry: 0,
    refetchInterval: 60000, // Refresh tokens every minute
  });
};
