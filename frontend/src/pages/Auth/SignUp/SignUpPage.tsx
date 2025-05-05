import { IonContent, IonPage } from '@ionic/react';

import './SignUpPage.scss';
import { PropsWithTestId } from 'common/components/types';
import ProgressProvider from 'common/providers/ProgressProvider';
import SignUpForm from './components/SignUpForm';
import Container from 'common/components/Content/Container';
import splashBg from 'assets/Splash.png';

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
  return (
    <IonPage className="ls-signup-page" data-testid={testid}>
      <ProgressProvider>
        <IonContent fullscreen scrollY={true} className="ls-signup-page__content">
          <div
            className="ls-signup-page__background"
            style={{ backgroundImage: `url(${splashBg})` }}
          />
          <Container className="ls-signup-page__container">
            <SignUpForm className="ls-signup-page__form" />
          </Container>
        </IonContent>
      </ProgressProvider>
    </IonPage>
  );
};

export default SignUpPage;
