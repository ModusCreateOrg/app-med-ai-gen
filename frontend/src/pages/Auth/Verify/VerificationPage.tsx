import { IonContent, IonPage } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

import './VerificationPage.scss';
import { PropsWithTestId } from 'common/components/types';
import ProgressProvider from 'common/providers/ProgressProvider';
import Header from 'common/components/Header/Header';
import VerificationForm from './components/VerificationForm';
import Container from 'common/components/Content/Container';

/**
 * Properties for the `VerificationPage` component.
 */
interface VerificationPageProps extends PropsWithTestId {}

/**
 * The `VerificationPage` renders the layout for user email verification.
 * @param {VerificationPageProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const VerificationPage = ({ testid = 'page-verification' }: VerificationPageProps): JSX.Element => {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>('');

  // Get email from sessionStorage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('verification_email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  return (
    <IonPage className="ls-verification-page" data-testid={testid}>
      <ProgressProvider>
        <Header title={t('email-verification.title', { ns: 'auth' })} />

        <IonContent fullscreen className="ion-padding">
          <Container className="ls-verification-page__container" fixed>
            <VerificationForm className="ls-verification-page__form" email={email} />
          </Container>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default VerificationPage; 