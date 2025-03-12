import { IonContent, IonPage } from '@ionic/react';
import { useTranslation } from 'react-i18next';

import './ResetPasswordPage.scss';
import { PropsWithTestId } from 'common/components/types';
import ProgressProvider from 'common/providers/ProgressProvider';
import Header from 'common/components/Header/Header';
import ResetPasswordForm from './components/ResetPasswordForm';
import Container from 'common/components/Content/Container';

/**
 * Properties for the `ResetPasswordPage` component.
 */
interface ResetPasswordPageProps extends PropsWithTestId {}

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
        <Header title={t('password-reset.title', { ns: 'auth' })} />

        <IonContent fullscreen className="ion-padding">
          <Container className="ls-reset-password-page__container" fixed>
            <ResetPasswordForm className="ls-reset-password-page__form" />
          </Container>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default ResetPasswordPage; 