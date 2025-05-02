import { IonContent, IonImg, IonPage } from '@ionic/react';
import { useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
import { useTranslation } from 'react-i18next';

import './SplashPage.scss';
import splashBg from '../../../../src/assets/Splash.png';
import logo from '../../../assets/logo_ls.png';
import { PropsWithTestId } from 'common/components/types';

/**
 * Properties for the `SplashPage` component.
 */
interface SplashPageProps extends PropsWithTestId {}

/**
 * The `SplashPage` renders the initial splash screen with the app logo.
 * It automatically redirects to the login page after a short delay.
 *
 * @param {SplashPageProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const SplashPage = ({ testid = 'page-splash' }: SplashPageProps): JSX.Element => {
  const router = useIonRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // Redirect to login page after a delay
    const timer = setTimeout(() => {
      router.push('/auth/signin', 'forward', 'replace');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <IonPage className="ls-splash-page" data-testid={testid}>
      <IonContent fullscreen className="ion-no-padding">
        <div className="ls-splash-page__container">
          <img
            src={splashBg}
            alt={t('splash.background-alt', { ns: 'common' })}
            className="ls-splash-page__background"
          />
          <div className="ls-splash-page__logo-container">
            <IonImg
              src={logo}
              alt={t('splash.logo-alt', { ns: 'common' })}
              className="ls-splash-page__logo"
            />
            <span className="ls-splash-page__app-name">{t('app.name', { ns: 'common' })}</span>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SplashPage;
