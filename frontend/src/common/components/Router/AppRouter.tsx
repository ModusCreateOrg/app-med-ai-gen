import { IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router';

import PrivateOutlet from './PrivateOutlet';
import TabNavigation from './TabNavigation';
import SignInPage from 'pages/Auth/SignIn/SignInPage';
import SignUpPage from 'pages/Auth/SignUp/SignUpPage';
import SignOutPage from 'pages/Auth/SignOut/SignOutPage';
import VerificationPage from 'pages/Auth/Verify/VerificationPage';
import OAuthRedirectHandler from 'pages/Auth/OAuth/OAuthRedirectHandler';
import ForgotPasswordPage from 'pages/Auth/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from 'pages/Auth/ResetPassword/ResetPasswordPage';
import SplashPage from 'pages/Auth/Splash/SplashPage';

/**
 * The application router.  This is the main router for the Ionic React
 * application.
 *
 * This application uses Ionic tab navigation, therefore, the main
 * router redirect users to the `TabNavigation` component.
 * @returns JSX
 * @see {@link TabNavigation}
 */
const AppRouter = (): JSX.Element => {
  return (
    <IonReactRouter>
      <IonRouterOutlet>
        <Route
          path="/tabs"
          render={() => (
            <PrivateOutlet>
              <TabNavigation />
            </PrivateOutlet>
          )}
        />
        <Route exact path="/auth/signin" render={() => <SignInPage />} />
        <Route exact path="/auth/signup" render={() => <SignUpPage />} />
        <Route exact path="/auth/verify" render={() => <VerificationPage />} />
        <Route exact path="/auth/oauth" render={() => <OAuthRedirectHandler />} />
        <Route exact path="/auth/signout" render={() => <SignOutPage />} />
        <Route exact path="/auth/forgot-password" render={() => <ForgotPasswordPage />} />
        <Route exact path="/auth/reset-password" render={() => <ResetPasswordPage />} />
        <Route exact path="/auth/splash" render={() => <SplashPage />} />
        <Route exact path="/">
          <Redirect to="/auth/splash" />
        </Route>
        <Route render={() => <Redirect to="/auth/splash" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

export default AppRouter;
