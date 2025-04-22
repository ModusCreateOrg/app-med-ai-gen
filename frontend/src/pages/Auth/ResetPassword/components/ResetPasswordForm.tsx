import {
  IonButton,
  IonInputPasswordToggle,
  useIonRouter,
  useIonViewDidEnter,
  IonText,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useRef, useState, useEffect } from 'react';
import classNames from 'classnames';
import { Form, Formik } from 'formik';
import { object, string, ref } from 'yup';
import { useTranslation } from 'react-i18next';

import './ResetPasswordForm.scss';
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
 * Properties for the `ResetPasswordForm` component.
 */
interface ResetPasswordFormProps extends BaseComponentProps {}

/**
 * Reset password form values.
 */
interface ResetPasswordFormValues {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

/**
 * The `ResetPasswordForm` component renders a form for resetting a password with a verification code.
 * @param {ResetPasswordFormProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const ResetPasswordForm = ({
  className,
  testid = 'form-reset-password',
}: ResetPasswordFormProps): JSX.Element => {
  const focusInput = useRef<HTMLIonInputElement>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string>('');
  const { setIsActive: setShowProgress } = useProgress();
  const router = useIonRouter();
  const { confirmResetPassword } = useAuth();
  const { t } = useTranslation();

  // Get email from sessionStorage if available
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('reset_password_email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  /**
   * Reset password form validation schema.
   */
  const validationSchema = object({
    code: string()
      .matches(/^\d+$/, t('validation.numeric', { ns: 'auth' }))
      .required(t('validation.required', { ns: 'auth' })),
    password: string()
      .min(8, t('validation.min-length', { length: 8, ns: 'auth' }))
      .matches(/[A-Z]/, t('validation.uppercase', { ns: 'auth' }))
      .matches(/[0-9]/, t('validation.number', { ns: 'auth' }))
      .matches(/[^A-Za-z0-9]/, t('validation.special-char', { ns: 'auth' }))
      .required(t('validation.required', { ns: 'auth' })),
    confirmPassword: string()
      .oneOf([ref('password')], t('validation.passwords-match', { ns: 'auth' }))
      .required(t('validation.required', { ns: 'auth' })),
  });

  useIonViewDidEnter(() => {
    focusInput.current?.setFocus();
  });

  return (
    <div className={classNames('ls-reset-password-form', className)} data-testid={testid}>
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
        <div className="ls-reset-password-form__success" data-testid={`${testid}-success`}>
          <IonText color="success">{successMessage}</IonText>
        </div>
      )}

      <Formik<ResetPasswordFormValues>
        initialValues={{
          email: email,
          code: '',
          password: '',
          confirmPassword: '',
        }}
        enableReinitialize={true}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setError(null);
            setSuccessMessage('');
            setIsLoading(true);
            setShowProgress(true);

            // Use stored email if available, otherwise use form value
            const emailToUse = email || values.email;

            if (!emailToUse) {
              throw new Error(t('error.no-email', { ns: 'auth' }));
            }

            await confirmResetPassword(emailToUse, values.code, values.password);

            // Show success message
            setSuccessMessage(t('password-reset.success', { ns: 'auth' }));

            // Clear reset email from session storage
            sessionStorage.removeItem('reset_password_email');

            // Wait before redirecting to allow the user to see the message
            setTimeout(() => {
              router.push('/auth/signin', 'forward', 'replace');
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
              <div>{t('password-reset.title', { ns: 'auth' })}</div>
            </HeaderRow>

            <div className="ls-reset-password-form__message">
              <IonText>{t('password-recovery.enter-code', { ns: 'auth' })}</IonText>
              {email && (
                <IonText className="ls-reset-password-form__email">
                  <strong>{email}</strong>
                </IonText>
              )}
            </div>

            {!email && (
              <Input
                name="email"
                label={t('label.email', { ns: 'auth' })}
                labelPlacement="stacked"
                maxlength={50}
                autocomplete="email"
                className="ls-reset-password-form__input"
                ref={focusInput}
                data-testid={`${testid}-field-email`}
                type="email"
              />
            )}

            <Input
              name="code"
              label={t('label.verification-code', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={6}
              className="ls-reset-password-form__input"
              data-testid={`${testid}-field-code`}
              type="text"
              inputmode="numeric"
              ref={email ? focusInput : undefined}
            />

            <Input
              type="password"
              name="password"
              label={t('label.password', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={30}
              autocomplete="new-password"
              className="ls-reset-password-form__input"
              data-testid={`${testid}-field-password`}
            >
              <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
            </Input>

            <Input
              type="password"
              name="confirmPassword"
              label={t('label.confirm-password', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={30}
              autocomplete="new-password"
              className="ls-reset-password-form__input"
              data-testid={`${testid}-field-confirm-password`}
            >
              <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
            </Input>

            <IonButton
              type="submit"
              color="primary"
              className="ls-reset-password-form__button"
              expand="block"
              disabled={isSubmitting || !dirty || isLoading}
              data-testid={`${testid}-button-submit`}
            >
              {t('password-reset.button', { ns: 'auth' })}
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

export default ResetPasswordForm;
