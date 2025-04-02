import { IonContent, IonPage, IonImg } from '@ionic/react';
import { useTranslation } from 'react-i18next';

import './ForgotPasswordPage.scss';
import { PropsWithTestId } from 'common/components/types';
import ProgressProvider from 'common/providers/ProgressProvider';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import Container from 'common/components/Content/Container';
import logo from 'assets/logo_ls.png';

/**
 * Properties for the `ForgotPasswordPage` component.
 */
interface ForgotPasswordPageProps extends PropsWithTestId {}

/**
 * The `ForgotPasswordPage` renders the layout for password recovery.
 * @param {ForgotPasswordPageProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const ForgotPasswordPage = ({ testid = 'page-forgot-password' }: ForgotPasswordPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <IonPage className="ls-forgot-password-page" data-testid={testid}>
      <ProgressProvider>
        <IonContent fullscreen className="ls-forgot-password-page__content">
          <div className="ls-forgot-password-page__background">
            <div className="ls-forgot-password-page__logo-container">
              <IonImg src={logo} alt="Logo" className="ls-forgot-password-page__logo" />
              <span className="ls-forgot-password-page__logo-text">{t('app.name', { ns: 'common' })}</span>
            </div>
            
            <Container className="ls-forgot-password-page__container" fixed>
              <div className="ls-forgot-password-page__card">
                <ForgotPasswordForm className="ls-forgot-password-page__form" />
              </div>
            </Container>
          </div>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default ForgotPasswordPage; 