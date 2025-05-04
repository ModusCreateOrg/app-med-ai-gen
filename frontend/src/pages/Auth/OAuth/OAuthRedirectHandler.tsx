import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import './OAuthRedirectHandler.scss';
import { PropsWithTestId } from 'common/components/types';
import LoaderSpinner from 'common/components/Loader/LoaderSpinner';
import ErrorCard from 'common/components/Card/ErrorCard';
import { mapCognitoUserToAppUser } from 'common/utils/user-mapper';
import { getAuthErrorMessage } from 'common/utils/auth-errors';
import { DirectCognitoAuthService } from 'common/services/auth/direct-cognito-auth-service';

/**
 * Properties for the `OAuthRedirectHandler` component.
 */
interface OAuthRedirectHandlerProps extends PropsWithTestId {}

/**
 * The `OAuthRedirectHandler` component handles OAuth redirects from social providers.
 * It processes the authentication response and redirects to the appropriate page.
 * @param {OAuthRedirectHandlerProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const OAuthRedirectHandler = ({
  testid = 'page-oauth-handler',
}: OAuthRedirectHandlerProps): JSX.Element => {
  const { t } = useTranslation();
  const router = useIonRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processOAuthRedirect = async () => {
      try {
        // Get the current session after OAuth
        const session = await DirectCognitoAuthService.getCurrentSession();

        if (session && session.tokens) {
          // Get the user data
          const currentUser = await DirectCognitoAuthService.getCurrentUser();

          if (currentUser) {
            // Map to our user model
            const userData = {
              username: currentUser.username || '',
              attributes: {
                email: currentUser.username || '',
                // Add more attributes if needed
              },
            };

            mapCognitoUserToAppUser(userData);
          }

          // Redirect to app home
          router.push('/tabs/home', 'forward', 'replace');
        } else {
          throw new Error('No valid session found');
        }
      } catch (err) {
        console.error('OAuth redirect error:', err);
        setError(getAuthErrorMessage(err));

        // If there's an error, redirect to sign in after a delay
        setTimeout(() => {
          router.push('/auth/signin', 'forward', 'replace');
        }, 3000);
      }
    };

    processOAuthRedirect();
  }, [router]);

  return (
    <IonPage className="ls-oauth-handler" data-testid={testid}>
      <IonContent fullscreen className="ion-padding">
        <div className="ls-oauth-handler__content">
          {error ? (
            <ErrorCard
              content={`${t('error.oauth-redirect', { ns: 'auth' })}: ${error}`}
              testid={`${testid}-error`}
            />
          ) : (
            <>
              <h2>{t('oauth.processing', { ns: 'auth' })}</h2>
              <LoaderSpinner className="ls-oauth-handler__spinner" />
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OAuthRedirectHandler;
