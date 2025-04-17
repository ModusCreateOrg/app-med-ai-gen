import { IonPage, IonContent, IonImg } from '@ionic/react';
import { useTranslation } from 'react-i18next';

import './ResetPasswordPage.scss';
import { BaseComponentProps } from 'common/components/types';
import logo from 'assets/logo_ls.png';
import ProgressProvider from 'common/providers/ProgressProvider';
import ResetPasswordForm from './components/ResetPasswordForm';
/**
 * Properties for the `ResetPasswordPage` component.
 */
interface ResetPasswordPageProps extends BaseComponentProps {}

/**
 * The `ResetPasswordPage` renders the layout for resetting a password.
 * @param {ResetPasswordPageProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const ResetPasswordPage = ({ testid = 'page-reset-password' }: ResetPasswordPageProps): JSX.Element => {
  const { t } = useTranslation();
  
  return (
    <IonPage className="ls-reset-password-page" data-testid={testid}>
      <ProgressProvider>
        <IonContent fullscreen>
          <div className="ls-reset-password-page__background">
            <div className="ls-reset-password-page__logo-container">
            <IonImg src={logo} alt="Logo" className="ls-signup-page__logo" />
            <span className="ls-signup-page__logo-text">{t('app.name', { ns: 'common' })}</span>
            </div>
            
            <div className="ls-reset-password-page__card">
              <ResetPasswordForm className="ls-reset-password-page__form" />
            </div>
          </div>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default ResetPasswordPage; 