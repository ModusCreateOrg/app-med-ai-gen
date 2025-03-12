import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import { useEffect, useState } from 'react';

import './SignOutPage.scss';
import { PropsWithTestId } from 'common/components/types';
import { useSignOut } from 'common/hooks/useAuth';
import LoaderSpinner from 'common/components/Loader/LoaderSpinner';
import { getAuthErrorMessage } from 'common/utils/auth-errors';

/**
 * The `SignOutPage` renders a loader while the application removes
 * authentication state from the currently signed in user.
 * @param {PropsWithTestId} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const SignOutPage = ({ testid = 'page-signout' }: PropsWithTestId): JSX.Element => {
  const router = useIonRouter();
  const { signOut } = useSignOut();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut();
        router.push('/auth/signin', 'forward', 'replace');
      } catch (err) {
        setError(getAuthErrorMessage(err));
        // If sign out fails, redirect to home after a short delay
        setTimeout(() => {
          router.push('/auth/signin', 'forward', 'replace');
        }, 2000);
      }
    };

    performSignOut();
  }, [signOut, router]);

  return (
    <IonPage className="ls-page-signout" data-testid={testid}>
      <IonContent fullscreen>
        {error ? (
          <div className="ls-page-signout__error">
            <p>Sign out failed: {error}</p>
            <p>Redirecting to sign in page...</p>
          </div>
        ) : (
          <LoaderSpinner className="ls-page-signout__loader-spinner" />
        )}
      </IonContent>
    </IonPage>
  );
};

export default SignOutPage;
