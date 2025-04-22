import { IonContent, IonPage } from '@ionic/react';
import { useTranslation } from 'react-i18next';

import './ForgotPasswordPage.scss';
import { PropsWithTestId } from 'common/components/types';
import ProgressProvider from 'common/providers/ProgressProvider';
import Header from 'common/components/Header/Header';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import Container from 'common/components/Content/Container';

/**
 * Properties for the `ForgotPasswordPage` component.
 */
interface ForgotPasswordPageProps extends PropsWithTestId {}

/**
 * The `ForgotPasswordPage` renders the layout for password recovery.
 * @param {ForgotPasswordPageProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const ForgotPasswordPage = ({
  testid = 'page-forgot-password',
}: ForgotPasswordPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <IonPage className="ls-forgot-password-page" data-testid={testid}>
      <ProgressProvider>
        <Header title={t('password-recovery.title', { ns: 'auth' })} />

        <IonContent fullscreen className="ion-padding">
          <Container className="ls-forgot-password-page__container" fixed>
            <ForgotPasswordForm className="ls-forgot-password-page__form" />
          </Container>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default ForgotPasswordPage;
