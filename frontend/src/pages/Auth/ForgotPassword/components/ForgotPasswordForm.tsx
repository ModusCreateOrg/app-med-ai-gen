import {
  IonButton,
  useIonRouter,
  useIonViewDidEnter,
  IonText,
  IonIcon,
} from '@ionic/react';
import { useRef, useState } from 'react';
import classNames from 'classnames';
import { Form, Formik } from 'formik';
import { object, string } from 'yup';
import { useTranslation } from 'react-i18next';
import { lockClosed } from 'ionicons/icons';

import './ForgotPasswordForm.scss';
import { BaseComponentProps } from 'common/components/types';
import { AuthError } from 'common/models/auth';
import { useAuth } from 'common/hooks/useAuth';
import { useProgress } from 'common/hooks/useProgress';
import Input from 'common/components/Input/Input';
import { formatAuthError } from 'common/utils/auth-errors';
import AuthErrorDisplay from 'common/components/Auth/AuthErrorDisplay';
import AuthLoadingIndicator from 'common/components/Auth/AuthLoadingIndicator';

/**
 * Properties for the `ForgotPasswordForm` component.
 */
interface ForgotPasswordFormProps extends BaseComponentProps {}

/**
 * Forgot password form values.
 */
interface ForgotPasswordFormValues {
  email: string;
}

/**
 * The `ForgotPasswordForm` component renders a form for password recovery.
 * @param {ForgotPasswordFormProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const ForgotPasswordForm = ({ className, testid = 'form-forgot-password' }: ForgotPasswordFormProps): JSX.Element => {
  const focusInput = useRef<HTMLIonInputElement>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsActive: setShowProgress } = useProgress();
  const router = useIonRouter();
  const { forgotPassword } = useAuth();
  const { t } = useTranslation();

  /**
   * Forgot password form validation schema.
   */
  const validationSchema = object({
    email: string()
      .email(t('validation.email', { ns: 'auth' }))
      .required(t('validation.required', { ns: 'auth' })),
  });

  useIonViewDidEnter(() => {
    focusInput.current?.setFocus();
  });

  const handleBackToLogin = () => {
    router.push('/auth/signin', 'back');
  };

  const renderErrorContent = () => {
    if (!error) return null;

    // Check if it's a specific error like account not found
    if (error.code === 'UserNotFoundException') {
      return (
        <div className="ls-forgot-password-form__error-content">
          <div className="ls-forgot-password-form__error-title">
            {t('account-not-found.title', { ns: 'auth' })}
          </div>
          <div className="ls-forgot-password-form__error-message">
            {t('account-not-found.message', { ns: 'auth' })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={classNames('ls-forgot-password-form', className)} data-testid={testid}>
      {error && (
        <div className="ls-forgot-password-form__custom-error" data-testid={`${testid}-custom-error`}>
          {renderErrorContent() || (
            <AuthErrorDisplay 
              error={error} 
              showDetails={true}
              className="ls-forgot-password-form__error"
              testid={`${testid}-error`}
            />
          )}
        </div>
      )}

      <AuthLoadingIndicator 
        isLoading={isLoading} 
        message={t('loading', { ns: 'auth' })}
        testid={`${testid}-loading`}
      />

      {successMessage && (
        <div className="ls-forgot-password-form__success" data-testid={`${testid}-success`}>
          <IonText color="success">{successMessage}</IonText>
        </div>
      )}

      <Formik<ForgotPasswordFormValues>
        initialValues={{
          email: '',
        }}
        validationSchema={validationSchema}
        validateOnChange={true}
        validateOnBlur={true}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setError(null);
            setSuccessMessage('');
            setIsLoading(true);
            setShowProgress(true);
            
            await forgotPassword(values.email);
            
            // Store the email in sessionStorage for the reset password page
            sessionStorage.setItem('reset_password_email', values.email);
            
            // Show success message
            setSuccessMessage(t('password-recovery.success', { ns: 'auth' }));
            
            // Wait before redirecting to allow the user to see the message
            setTimeout(() => {
              router.push('/auth/reset-password', 'forward', 'replace');
            }, 2000);
          } catch (err) {
            setError(formatAuthError(err));
          } finally {
            setShowProgress(false);
            setSubmitting(false);
            setIsLoading(false);
          }
        }}
      >
        {({ dirty, isSubmitting, isValid }) => (
          <Form data-testid={`${testid}-form`}>
            <div className="ls-forgot-password-form__icon-container">
              <div className="ls-forgot-password-form__icon-circle">
                <IonIcon icon={lockClosed} className="ls-forgot-password-form__icon" />
              </div>
            </div>

            <h2 className="ls-forgot-password-form__title">
              {t('password-recovery.title', { ns: 'auth' })}
            </h2>

            <div className="ls-forgot-password-form__message">
              <IonText>
                {t('password-recovery.message', { ns: 'auth' })}
              </IonText>
            </div>

            <div className="ls-forgot-password-form__field">
              <label className="ls-forgot-password-form__label">{t('label.email_address', { ns: 'auth' })}</label>
              <Input
                name="email"
                maxlength={50}
                autocomplete="email"
                className="ls-forgot-password-form__input"
                ref={focusInput}
                data-testid={`${testid}-field-email`}
                type="email"
                placeholder=""
              />
            </div>

            <IonButton
              type="submit"
              className="ls-forgot-password-form__button"
              color="secondary"
              expand="block"
              disabled={isSubmitting || !dirty || !isValid || isLoading}
              data-testid={`${testid}-button-submit`}
            >
              {t('submit', { ns: 'auth' })}
            </IonButton>
            
            <div className="ls-forgot-password-form__back-link" onClick={handleBackToLogin}>
              <IonText color="medium">← Back to <span className="login-text">Log in</span></IonText>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ForgotPasswordForm; 