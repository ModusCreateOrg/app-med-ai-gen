import { IonText } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import './AuthErrorDisplay.scss';
import ErrorCard from '../Card/ErrorCard';
import { BaseComponentProps } from '../types';
import { AuthError } from 'common/models/auth';

/**
 * Properties for the `AuthErrorDisplay` component.
 */
interface AuthErrorDisplayProps extends BaseComponentProps {
  error?: AuthError | string | null;
  showDetails?: boolean;
}

/**
 * A component that displays authentication errors in a consistent format.
 * @param {AuthErrorDisplayProps} props - Component properties.
 * @returns {JSX.Element | null} JSX or null if no error
 */
const AuthErrorDisplay = ({
  className,
  error,
  showDetails = false,
  testid = 'auth-error-display',
}: AuthErrorDisplayProps): JSX.Element | null => {
  const { t } = useTranslation();

  if (!error) return null;

  // If error is a string, just display it
  if (typeof error === 'string') {
    return <ErrorCard className={className} content={error} testid={testid} />;
  }

  // If error is an AuthError object
  return (
    <div className={`ls-auth-error-display ${className || ''}`} data-testid={testid}>
      <ErrorCard content={error.message} testid={`${testid}-card`} />

      {showDetails && error.code && (
        <div className="ls-auth-error-display__details" data-testid={`${testid}-details`}>
          <IonText color="medium">
            <small>
              {t('error.details', { ns: 'auth' })}: {error.code}
            </small>
          </IonText>
        </div>
      )}
    </div>
  );
};

export default AuthErrorDisplay;
