import { IonContent, IonPage } from '@ionic/react';
import { useTranslation } from 'react-i18next';

import './SignUpPage.scss';
import { PropsWithTestId } from 'common/components/types';
import ProgressProvider from 'common/providers/ProgressProvider';
import Header from 'common/components/Header/Header';
import SignUpForm from './components/SignUpForm';
import Container from 'common/components/Content/Container';

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
        <Header title={t('signup', { ns: 'auth' })} />

        <IonContent fullscreen className="ion-padding" scrollY={true}>
          <Container className="ls-signup-page__container" fixed>
            <SignUpForm className="ls-signup-page__form" />
          </Container>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default SignUpPage;
