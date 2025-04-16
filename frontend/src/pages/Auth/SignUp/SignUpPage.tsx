import { IonContent, IonPage, IonImg } from '@ionic/react';
import { useTranslation } from 'react-i18next';

import './SignUpPage.scss';
import { PropsWithTestId } from 'common/components/types';
import ProgressProvider from 'common/providers/ProgressProvider';
import SignUpForm from './components/SignUpForm';
import logo from 'assets/logo_ls.png';

/**
 * Properties for the `SignUpPage` component.
 */
interface SignUpPageProps extends PropsWithTestId {}

/**
 * The `SignUpPage` renders the layout for user registration.
 * @param {SignUpPageProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const SignUpPage = ({ testid = 'page-signup' }: SignUpPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <IonPage className="ls-signup-page" data-testid={testid}>
      <ProgressProvider>
        <IonContent fullscreen className="ion-padding" scrollY={true}>
          <div className="ls-signup-page__container">
            <div className="ls-signup-page__logo-container">
              <IonImg src={logo} alt="Logo" className="ls-signup-page__logo" />
              <span className="ls-signup-page__logo-text">{t('app.name', { ns: 'common' })}</span>
            </div>
            
            <div className="ls-signup-page__card">
              <SignUpForm className="ls-signup-page__form" />
            </div>
          </div>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default SignUpPage; 