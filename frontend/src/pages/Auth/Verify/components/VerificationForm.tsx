import {
  IonButton,
  useIonRouter,
  IonText,
} from '@ionic/react';
import { useState } from 'react';
import classNames from 'classnames';
import { Form, Formik } from 'formik';
import { object, string } from 'yup';
import { useTranslation } from 'react-i18next';

import './VerificationForm.scss';
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
 * Properties for the `VerificationForm` component.
 */
interface VerificationFormProps extends BaseComponentProps {
  email: string;
}

/**
 * Email verification form values.
 */
interface VerificationFormValues {
  code: string;
}

/**
 * The `VerificationForm` component renders a form for verifying a user's email with a code.
 * @param {VerificationFormProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const VerificationForm = ({ className, email, testid = 'form-verification' }: VerificationFormProps): JSX.Element => {
  const [error, setError] = useState<AuthError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsActive: setShowProgress } = useProgress();
  const router = useIonRouter();
  const { confirmSignUp, resendConfirmationCode } = useAuth();
  const { t } = useTranslation();

  /**
   * Verification form validation schema.
   */
  const validationSchema = object({
    code: string()
      .matches(/^\d+$/, t('validation.numeric', { ns: 'auth' }))
      .length(6, t('validation.exact-length', { length: 6, ns: 'auth' }))
      .required(t('validation.required', { ns: 'auth' })),
  });

  /**
   * Handle resend code button click
   */
  const handleResendCode = async () => {
    if (!email) {
      setError(formatAuthError({
        code: 'NoEmailError',
        message: t('error.no-email', { ns: 'auth' }),
        name: 'NoEmailError'
      }));
      return;
    }

    try {
      setError(null);
      setSuccessMessage('');
      setIsLoading(true);
      setShowProgress(true);
      await resendConfirmationCode(email);
      setSuccessMessage(t('email-verification.code-resent', { ns: 'auth' }));
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setShowProgress(false);
      setIsLoading(false);
    }
  };

  return (
    <div className={classNames('ls-verification-form', className)} data-testid={testid}>
      <AuthErrorDisplay 
        error={error} 
        showDetails={true}
        className="ion-margin-bottom"
        testid={`${testid}-error`}
      />

      <AuthLoadingIndicator 
        isLoading={isLoading} 
        message={t('verification.loading', { ns: 'auth' })}
        testid={`${testid}-loading`}
      />

      {successMessage && (
        <div className="ls-verification-form__success" data-testid={`${testid}-success`}>
          <IonText color="success">{successMessage}</IonText>
        </div>
      )}

      <Formik<VerificationFormValues>
        initialValues={{
          code: '',
        }}
        onSubmit={async (values, { setSubmitting }) => {
          if (!email) {
            setError(formatAuthError({
              code: 'NoEmailError',
              message: t('error.no-email', { ns: 'auth' }),
              name: 'NoEmailError'
            }));
            return;
          }

          try {
            setError(null);
            setSuccessMessage('');
            setIsLoading(true);
            setShowProgress(true);
            await confirmSignUp(email, values.code);
            
            // Show success message briefly before redirecting
            setSuccessMessage(t('email-verification.success', { ns: 'auth' }));
            setIsLoading(false);
            
            // Short delay before redirect to allow user to see success message
            setTimeout(() => {
              router.push('/auth/signin', 'forward', 'replace');
            }, 1500);
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
              <div>{t('email-verification.title', { ns: 'auth' })}</div>
            </HeaderRow>

            <div className="ls-verification-form__message">
              <IonText>
                {t('email-verification.message', { ns: 'auth' })}
              </IonText>
              {email && (
                <IonText className="ls-verification-form__email">
                  <strong>{email}</strong>
                </IonText>
              )}
            </div>

            <Input
              name="code"
              label={t('label.verification-code', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={6}
              className="ls-verification-form__input"
              data-testid={`${testid}-field-code`}
              type="text"
              inputmode="numeric"
            />

            <IonButton
              type="submit"
              color="primary"
              className="ls-verification-form__button"
              expand="block"
              disabled={isSubmitting || !dirty || isLoading}
              data-testid={`${testid}-button-submit`}
            >
              {t('confirm', { ns: 'auth' })}
            </IonButton>
            
            <div className="ls-verification-form__resend">
              <IonButton
                fill="clear"
                color="medium"
                onClick={handleResendCode}
                disabled={isSubmitting || isLoading}
                data-testid={`${testid}-button-resend`}
              >
                {t('resend-code', { ns: 'auth' })}
              </IonButton>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default VerificationForm; 