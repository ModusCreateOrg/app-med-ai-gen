import { IonContent, IonPage, IonImg } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

import './VerificationPage.scss';
import { PropsWithTestId } from 'common/components/types';
import ProgressProvider from 'common/providers/ProgressProvider';
import VerificationForm from './components/VerificationForm';
import logo from '../../../assets/logo_ls.png';

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
        <IonContent fullscreen className="ion-no-padding">
          <div className="ls-verification-page__background">
            <div className="ls-verification-page__logo-container">
              <IonImg
                src={logo}
                alt={t('verification.logo-alt', { ns: 'common' })}
                className="ls-verification-page__logo"
              />
              <span className="ls-verification-page__logo-text">
                {t('app.name', { ns: 'common' })}
              </span>
            </div>

            <div className="ls-verification-page__card">
              <VerificationForm className="ls-verification-page__form" email={email} />
            </div>
          </div>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default VerificationPage;
