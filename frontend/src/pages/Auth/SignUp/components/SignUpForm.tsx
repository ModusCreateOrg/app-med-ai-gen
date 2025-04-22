import {
  IonButton,
  IonInputPasswordToggle,
  useIonRouter,
  useIonViewDidEnter,
  IonText,
  IonRow,
  IonCol,
  IonIcon,
} from '@ionic/react';
import { useRef, useState } from 'react';
import classNames from 'classnames';
import { Form, Formik, useFormikContext } from 'formik';
import { object, string, ref } from 'yup';
import { useTranslation } from 'react-i18next';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';

import './SignUpForm.scss';
import { BaseComponentProps } from 'common/components/types';
import { AuthError } from 'common/models/auth';
import { useSignUp } from 'common/hooks/useAuth';
import { useProgress } from 'common/hooks/useProgress';
import Input from 'common/components/Input/Input';
import HeaderRow from 'common/components/Text/HeaderRow';
import { formatAuthError } from 'common/utils/auth-errors';
import AuthErrorDisplay from 'common/components/Auth/AuthErrorDisplay';
import AuthLoadingIndicator from 'common/components/Auth/AuthLoadingIndicator';

/**
 * Properties for the `SignUpForm` component.
 */
interface SignUpFormProps extends BaseComponentProps {}

/**
 * Sign up form values.
 */
interface SignUpFormValues {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

/**
 * Password guidelines component
 */
const PasswordGuidelines = () => {
  const { values } = useFormikContext<SignUpFormValues>();
  const password = values.password || '';
  const { t } = useTranslation();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const renderGuideline = (isValid: boolean, text: string) => {
    return (
      <div
        className={`ls-signup-form__password-guidelines-item ls-signup-form__password-guidelines-item-${
          isValid ? 'valid' : 'invalid'
        }`}
      >
        <IonIcon
          icon={isValid ? checkmarkCircle : closeCircle}
          className="ls-signup-form__password-guidelines-item-icon"
        />
        <span>{text}</span>
      </div>
    );
  };

  return (
    <div className="ls-signup-form__password-guidelines">
      <div className="ls-signup-form__password-guidelines-header">
        {t('password-requirements', { ns: 'auth' })}
      </div>
      {renderGuideline(hasMinLength, t('validation.min-length', { length: 8, ns: 'auth' }))}
      {renderGuideline(hasUppercase, t('validation.uppercase', { ns: 'auth' }))}
      {renderGuideline(hasNumber, t('validation.number', { ns: 'auth' }))}
      {renderGuideline(hasSpecialChar, t('validation.special-char', { ns: 'auth' }))}
    </div>
  );
};

/**
 * The `SignUpForm` component renders a form for user registration.
 * @param {SignUpFormProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const SignUpForm = ({ className, testid = 'form-signup' }: SignUpFormProps): JSX.Element => {
  const focusInput = useRef<HTMLIonInputElement>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setIsActive: setShowProgress } = useProgress();
  const router = useIonRouter();
  const { signUp, isLoading: isSignUpLoading } = useSignUp();
  const { t } = useTranslation();

  /**
   * Sign up form validation schema.
   */
  const validationSchema = object({
    email: string()
      .email(t('validation.email', { ns: 'auth' }))
      .required(t('validation.required', { ns: 'auth' })),
    firstName: string()
      .min(2, t('validation.min-length', { length: 2, ns: 'auth' }))
      .max(50, t('validation.max-length', { length: 50, ns: 'auth' }))
      .required(t('validation.required', { ns: 'auth' })),
    lastName: string()
      .min(2, t('validation.min-length', { length: 2, ns: 'auth' }))
      .max(50, t('validation.max-length', { length: 50, ns: 'auth' }))
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
    <div className={classNames('ls-signup-form', className)} data-testid={testid}>
      <AuthErrorDisplay
        error={error}
        showDetails={true}
        className="ion-margin-bottom ion-margin-top"
        testid={`${testid}-error`}
      />

      <AuthLoadingIndicator
        isLoading={isLoading}
        message={t('signup.loading', { ns: 'auth' })}
        testid={`${testid}-loading`}
      />

      <Formik<SignUpFormValues>
        initialValues={{
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          confirmPassword: '',
        }}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setError(null);
            setIsLoading(true);
            setShowProgress(true);
            await signUp(values.email, values.password, values.firstName, values.lastName);

            // Store the email in sessionStorage for the verification page
            sessionStorage.setItem('verification_email', values.email);

            // Show success briefly before redirecting
            setIsLoading(false);

            // Navigate to verification page
            router.push('/auth/verify', 'forward', 'replace');
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
              <div>{t('signup', { ns: 'auth' })}</div>
            </HeaderRow>

            <Input
              name="email"
              label={t('label.email', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={50}
              autocomplete="email"
              className="ls-signup-form__input"
              ref={focusInput}
              data-testid={`${testid}-field-email`}
              type="email"
            />

            <Input
              name="firstName"
              label={t('label.first-name', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={50}
              autocomplete="given-name"
              className="ls-signup-form__input"
              data-testid={`${testid}-field-first-name`}
            />

            <Input
              name="lastName"
              label={t('label.last-name', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={50}
              autocomplete="family-name"
              className="ls-signup-form__input"
              data-testid={`${testid}-field-last-name`}
            />

            <Input
              type="password"
              name="password"
              label={t('label.password', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={30}
              autocomplete="new-password"
              className="ls-signup-form__input"
              data-testid={`${testid}-field-password`}
            >
              <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
            </Input>

            <PasswordGuidelines />

            <Input
              type="password"
              name="confirmPassword"
              label={t('label.confirm-password', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={30}
              autocomplete="new-password"
              className="ls-signup-form__input"
              data-testid={`${testid}-field-confirm-password`}
            >
              <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
            </Input>

            <IonButton
              type="submit"
              color="primary"
              className="ls-signup-form__button"
              expand="block"
              disabled={isSubmitting || !dirty || isSignUpLoading || isLoading}
              data-testid={`${testid}-button-submit`}
            >
              {t('signup', { ns: 'auth' })}
            </IonButton>

            <IonRow className="ion-text-center ion-padding-top">
              <IonCol>
                <IonText color="medium">
                  {t('already-have-account', { ns: 'auth' })}{' '}
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

export default SignUpForm;
