import { IonContent, IonPage } from '@ionic/react';
import { PropsWithChildren, useEffect, useState } from 'react';

import './AuthProvider.scss';
import { useGetUserTokens } from 'common/api/useGetUserTokens';
import LoaderSpinner from 'common/components/Loader/LoaderSpinner';
import { AuthContext, AuthContextValue } from './AuthContext';
import { useAuthOperations } from 'common/hooks/useAuthOperations';
import { AuthState } from 'common/models/auth';
import CognitoAuthService from 'common/services/auth/cognito-auth-service';
import { mapCognitoUserToAppUser } from 'common/utils/user-mapper';

/**
 * Extract user information from ID token
 * @param idToken ID token string
 * @returns User attributes from token
 */
const extractUserInfoFromToken = (idToken: string) => {
  try {
    // Decode the JWT token to get the payload
    const payload = JSON.parse(atob(idToken.split('.')[1]));

    return {
      sub: payload.sub,
      email: payload.email,
      given_name: payload.given_name || payload.email?.split('@')[0] || '',
      family_name: payload.family_name || '',
      email_verified: payload.email_verified,
      name: payload.name,
    };
  } catch (error) {
    console.error('Error extracting user info from token:', error);
    return null;
  }
};

/**
 * The `AuthProvider` component creates and provides access to the `AuthContext`
 * value.
 * @param {PropsWithChildren} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const AuthProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const { data: userTokens, isPending, isSuccess, refetch: refetchUserTokens } = useGetUserTokens();
  const [isInitializing, setIsInitializing] = useState(true);
  const [authState, setAuthState] = useState(AuthState.SIGNED_OUT);

  // Get all authentication operations from our hook
  const {
    isLoading,
    error,
    user,
    setUser,
    clearError,
    signIn,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    signOut,
    signInWithGoogle,
    signInWithApple,
    forgotPassword,
    confirmResetPassword,
  } = useAuthOperations();

  // Extract user info from tokens when they change
  useEffect(() => {
    if (userTokens?.id_token) {
      const userInfo = extractUserInfoFromToken(userTokens.id_token);

      if (userInfo) {
        const userData = {
          username: userInfo.email || '',
          attributes: {
            sub: userInfo.sub,
            email: userInfo.email || '',
            given_name: userInfo.given_name || '',
            family_name: userInfo.family_name || '',
            email_verified: String(userInfo.email_verified || false),
            name: userInfo.name || '',
          },
        };

        const appUser = mapCognitoUserToAppUser(userData);
        console.log('User from token:', appUser);
        setUser?.(appUser);
      }
    }
  }, [userTokens, setUser]);

  // Check if there's an authenticated session on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Try to get the current user from Cognito
        const currentUser = await CognitoAuthService.getCurrentUser();

        if (currentUser) {
          // If we have a user, update the auth state
          setAuthState(AuthState.SIGNED_IN);

          // Get tokens to extract user info
          const tokens = await CognitoAuthService.getUserTokens();
          if (tokens?.id_token) {
            const userInfo = extractUserInfoFromToken(tokens.id_token);

            if (userInfo) {
              const userData = {
                username: userInfo.email || '',
                attributes: {
                  sub: userInfo.sub,
                  email: userInfo.email || '',
                  given_name: userInfo.given_name || '',
                  family_name: userInfo.family_name || '',
                  email_verified: String(userInfo.email_verified || false),
                  name: userInfo.name || '',
                },
              };

              const appUser = mapCognitoUserToAppUser(userData);
              console.log('User from token on init:', appUser);
              setUser?.(appUser);
            }
          } else {
            // Fallback if no tokens available
            const userData = {
              username: currentUser.username || '',
              attributes: {
                email: currentUser.signInDetails?.loginId || '',
                given_name: currentUser.username?.split('@')[0] || '',
                family_name: '',
              },
            };

            const appUser = mapCognitoUserToAppUser(userData);
            console.log('Fallback user:', appUser);
            setUser?.(appUser);
          }
        } else {
          setAuthState(AuthState.SIGNED_OUT);
        }
      } catch (err) {
        // If there's an error, set to signed out
        setAuthState(AuthState.SIGNED_OUT);
        console.error('Error checking auth state:', err);
      } finally {
        // Initialization is complete
        setIsInitializing(false);
      }
    };

    checkAuthState();
  }, [setUser]);

  // The combined auth context value
  const value: AuthContextValue = {
    isAuthenticated: isSuccess || authState === AuthState.SIGNED_IN,
    authState,
    isLoading: isPending || isLoading || isInitializing,
    userTokens,
    refetchUserTokens,
    user,
    error,
    clearError,
    signIn,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    signOut,
    signInWithGoogle,
    signInWithApple,
    forgotPassword,
    confirmResetPassword,
  };

  // Only render children when not initializing
  const isReady = !isPending && !isInitializing;

  return (
    <AuthContext.Provider value={value}>
      {isReady && <>{children}</>}
      {!isReady && (
        <IonPage className="ls-auth-provider">
          <IonContent fullscreen>
            <LoaderSpinner className="ls-auth-provider__spinner" />
          </IonContent>
        </IonPage>
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
