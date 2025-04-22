import { IonButton, IonRow, IonCol, IonText } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import './SocialLoginButtons.scss';

import { BaseComponentProps } from '../types';
import Icon from '../Icon/Icon';
import { useSocialSignIn } from 'common/hooks/useAuth';

/**
 * Properties for the `SocialLoginButtons` component.
 */
interface SocialLoginButtonsProps extends BaseComponentProps {
  disabled?: boolean;
}

/**
 * A component that renders social login buttons (Google, Apple)
 * @param {SocialLoginButtonsProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const SocialLoginButtons = ({
  className,
  disabled = false,
  testid = 'social-login-buttons',
}: SocialLoginButtonsProps): JSX.Element => {
  const { t } = useTranslation();
  const { signInWithGoogle, signInWithApple, isLoading } = useSocialSignIn();

  const isButtonDisabled = disabled || isLoading;

  return (
    <div className={`ls-social-login-buttons ${className || ''}`} data-testid={testid}>
      <IonRow className="ion-text-center ion-padding">
        <IonCol>
          <IonText color="medium">{t('or-signin-with', { ns: 'auth' })}</IonText>
        </IonCol>
      </IonRow>

      <IonRow>
        <IonCol>
          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            onClick={signInWithGoogle}
            disabled={isButtonDisabled}
            data-testid={`${testid}-button-google`}
            className="ls-social-login-buttons__google"
          >
            <Icon icon="google" slot="start" />
            Google
          </IonButton>
        </IonCol>
        <IonCol>
          <IonButton
            expand="block"
            fill="outline"
            color="dark"
            onClick={signInWithApple}
            disabled={isButtonDisabled}
            data-testid={`${testid}-button-apple`}
            className="ls-social-login-buttons__apple"
          >
            <Icon icon="apple" slot="start" />
            Apple
          </IonButton>
        </IonCol>
      </IonRow>
    </div>
  );
};

export default SocialLoginButtons;
