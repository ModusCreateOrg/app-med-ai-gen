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
    clearError,
    signIn,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    signOut,
    signInWithGoogle,
    signInWithApple,
  } = useAuthOperations();

  // Check if there's an authenticated session on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Try to get the current user from Cognito
        const currentUser = await CognitoAuthService.getCurrentUser();
        
        if (currentUser) {
          // In Amplify v6, the user information might be structured differently
          // We can't directly access attributes, so we need to extract what we can
          const userData = {
            username: currentUser.username || '',
            attributes: {
              // Extract whatever attributes are available from the user object
              email: currentUser.signInDetails?.loginId || '',
            }
          };
          
          // Map the userData to our app's user model
          mapCognitoUserToAppUser(userData);
          
          // If we have a user, update the auth state
          setAuthState(AuthState.SIGNED_IN);
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
  }, []);

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
