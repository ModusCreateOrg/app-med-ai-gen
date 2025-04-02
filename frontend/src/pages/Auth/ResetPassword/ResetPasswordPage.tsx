import { IonPage, IonContent } from '@ionic/react';

import './ResetPasswordPage.scss';
import { BaseComponentProps } from 'common/components/types';
import Container from 'common/components/Content/Container';
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
  
  return (
    <IonPage className="ls-reset-password-page" data-testid={testid}>
      <ProgressProvider>
        <IonContent fullscreen>
          <Container className="ls-reset-password-page__container" fixed>
            <ResetPasswordForm className="ls-reset-password-page__form" />
          </Container>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default ResetPasswordPage; 