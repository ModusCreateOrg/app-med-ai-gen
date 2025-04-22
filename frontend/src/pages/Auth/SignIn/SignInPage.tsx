import { IonContent, IonPage, IonImg } from '@ionic/react';
import { useTranslation } from 'react-i18next';

import './SignInPage.scss';
import { PropsWithTestId } from 'common/components/types';
import ProgressProvider from 'common/providers/ProgressProvider';
import SignInForm from './components/SignInForm';
import logo from 'assets/logo_ls.png';

/**
 * Properties for the `SignInPage` component.
 */
interface SignInPageProps extends PropsWithTestId {}

/**
 * The `SignInPage` renders the layout for user authentication.
 * @param {SignInPageProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const SignInPage = ({ testid = 'page-signin' }: SignInPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <IonPage className="ls-signin-page" data-testid={testid}>
      <ProgressProvider>
        <IonContent fullscreen className="ion-padding">
          <div className="ls-signin-page__background">
            <div className="ls-signin-page__logo-container">
              <IonImg src={logo} alt="Logo" className="ls-signin-page__logo" />
              <span className="ls-signin-page__logo-text">{t('app.name', { ns: 'common' })}</span>
            </div>

            <div className="ls-signin-page__card">
              <div className="ls-signin-page__header">
                <h1>{t('signin.title', { ns: 'auth' })}</h1>
                <p>{t('signin.subtitle', { ns: 'auth' })}</p>
              </div>

              <SignInForm className="ls-signin-page__form" />
            </div>
          </div>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default SignInPage;
