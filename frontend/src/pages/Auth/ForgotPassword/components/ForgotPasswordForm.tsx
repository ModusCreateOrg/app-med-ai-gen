import { IonButton, useIonRouter, useIonViewDidEnter, IonText, IonRow, IonCol } from '@ionic/react';
import { useRef, useState } from 'react';
import classNames from 'classnames';
import { Form, Formik } from 'formik';
import { object, string } from 'yup';
import { useTranslation } from 'react-i18next';

import './ForgotPasswordForm.scss';
import { BaseComponentProps } from 'common/components/types';
import { AuthError } from 'common/models/auth';
import { useAuth } from 'common/hooks/useAuth';
import { useProgress } from 'common/hooks/useProgress';
import Input from 'common/components/Input/Input';
import HeaderRow from 'common/components/Text/HeaderRow';
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
const ForgotPasswordForm = ({
  className,
  testid = 'form-forgot-password',
}: ForgotPasswordFormProps): JSX.Element => {
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

  return (
    <div className={classNames('ls-forgot-password-form', className)} data-testid={testid}>
      <AuthErrorDisplay
        error={error}
        showDetails={true}
        className="ion-margin-bottom"
        testid={`${testid}-error`}
      />

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
        validationSchema={validationSchema}
      >
        {({ dirty, isSubmitting }) => (
          <Form data-testid={`${testid}-form`}>
            <HeaderRow border>
              <div>{t('password-recovery.title', { ns: 'auth' })}</div>
            </HeaderRow>

            <div className="ls-forgot-password-form__message">
              <IonText>{t('password-recovery.message', { ns: 'auth' })}</IonText>
            </div>

            <Input
              name="email"
              label={t('label.email', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={50}
              autocomplete="email"
              className="ls-forgot-password-form__input"
              ref={focusInput}
              data-testid={`${testid}-field-email`}
              type="email"
            />

            <IonButton
              type="submit"
              color="primary"
              className="ls-forgot-password-form__button"
              expand="block"
              disabled={isSubmitting || !dirty || isLoading}
              data-testid={`${testid}-button-submit`}
            >
              {t('submit', { ns: 'auth' })}
            </IonButton>

            <IonRow className="ion-text-center ion-padding-top">
              <IonCol>
                <IonText color="medium">
                  <a href="/auth/signin">{t('signin', { ns: 'auth' })}</a>
                </IonText>
              </IonCol>
            </IonRow>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ForgotPasswordForm;
