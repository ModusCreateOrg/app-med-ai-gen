import { IonSpinner, IonText } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import './AuthLoadingIndicator.scss';
import { BaseComponentProps } from '../types';

/**
 * Properties for the `AuthLoadingIndicator` component.
 */
interface AuthLoadingIndicatorProps extends BaseComponentProps {
  isLoading: boolean;
  message?: string;
}

/**
 * A component that displays a loading indicator for authentication actions.
 * @param {AuthLoadingIndicatorProps} props - Component properties.
 * @returns {JSX.Element | null} JSX or null if not loading
 */
const AuthLoadingIndicator = ({
  className,
  isLoading,
  message,
  testid = 'auth-loading',
}: AuthLoadingIndicatorProps): JSX.Element | null => {
  const { t } = useTranslation();

  if (!isLoading) return null;

  return (
    <div className={`ls-auth-loading ${className || ''}`} data-testid={testid}>
      <div className="ls-auth-loading__content">
        <IonSpinner name="circular" />
        <IonText>
          <p className="ls-auth-loading__message">{message || t('loading', { ns: 'auth' })}</p>
        </IonText>
      </div>
    </div>
  );
};

export default AuthLoadingIndicator;
