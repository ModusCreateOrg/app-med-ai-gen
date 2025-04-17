import {
  IonButton,
  IonInputPasswordToggle,
  useIonRouter,
  useIonViewDidEnter,
  IonIcon,
} from '@ionic/react';
import { useRef, useState } from 'react';
import classNames from 'classnames';
import { Form, Formik } from 'formik';
import { object, string, ref } from 'yup';
import { useTranslation } from 'react-i18next';
import { checkmarkOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';

import './SignUpForm.scss';
import { BaseComponentProps } from 'common/components/types';
import { AuthError } from 'common/models/auth';
import { useSignUp } from 'common/hooks/useAuth';
import { useProgress } from 'common/hooks/useProgress';
import Input from 'common/components/Input/Input';
import { formatAuthError } from 'common/utils/auth-errors';
import AuthErrorDisplay from 'common/components/Auth/AuthErrorDisplay';
import AuthLoadingIndicator from 'common/components/Auth/AuthLoadingIndicator';
import PasswordGuidelines from './PasswordGuidelines';

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
 * The `SignUpForm` component renders a form for user registration.
 * @param {SignUpFormProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const SignUpForm = ({ className, testid = 'form-signup' }: SignUpFormProps): JSX.Element => {
  const focusInput = useRef<HTMLIonInputElement>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { setIsActive: setShowProgress } = useProgress();
  const router = useIonRouter();
  const { signUp, isLoading: isSignUpLoading } = useSignUp();
  const { t } = useTranslation();
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

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

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      setError(null);
      setIsLoading(true);
      setShowProgress(true);
      await signUp(values.email, values.password, values.firstName, values.lastName);
      
      // Store the email in sessionStorage for the verification page
      sessionStorage.setItem('verification_email', values.email);
      
      // Show success briefly before redirecting
      setIsLoading(false);
      setRegistrationSuccess(true);
      setToastMessage(t('signup.success', { ns: 'auth', defaultValue: 'Registration successful!' }));
      setShowToast(true);
      
      // Navigate to verification page after a short delay
      setTimeout(() => {
        router.push('/auth/verify', 'forward', 'replace');
      }, 2000);
    } catch (error: unknown) {
      setError(formatAuthError(error));
      setToastMessage(
        error instanceof Error 
          ? error.message 
          : t('signup.error', { ns: 'auth', defaultValue: 'Registration failed' })
      );
      setShowToast(true);
    } finally {
      setShowProgress(false);
      setIsLoading(false);
    }
  };

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
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ dirty, isSubmitting, isValid, values }) => (
          <Form data-testid={`${testid}-form`}>
            <div className="ls-signup-form__header">
              <h1>{t('signup', { ns: 'auth' })}</h1>
              <p>{t('signup.subtitle', { ns: 'auth', defaultValue: 'Please fill in your personal details' })}</p>
            </div>

            <div className="ls-signup-form__divider"></div>

            {showToast && registrationSuccess && (
              <div className="ls-signup-form__toast">
                <IonIcon icon={checkmarkOutline} className="ls-signup-form__toast-icon" />
                <div className="ls-signup-form__toast-text">
                  {toastMessage}
                </div>
              </div>
            )}

            <div className="ls-signup-form__field">
              <label className="ls-signup-form__label">{t('label.first-name', { ns: 'auth' })}</label>
              <Input
                name="firstName"
                maxlength={50}
                autocomplete="given-name"
                className="ls-signup-form__input"
                ref={focusInput}
                data-testid={`${testid}-field-first-name`}
              />
            </div>

            <div className="ls-signup-form__field">
              <label className="ls-signup-form__label">{t('label.last-name', { ns: 'auth' })}</label>
              <Input
                name="lastName"
                maxlength={50}
                autocomplete="family-name"
                className="ls-signup-form__input"
                data-testid={`${testid}-field-last-name`}
              />
            </div>

            <div className="ls-signup-form__field">
              <label className="ls-signup-form__label">{t('label.email', { ns: 'auth' })}</label>
              <Input
                name="email"
                maxlength={50}
                autocomplete="email"
                className="ls-signup-form__input"
                data-testid={`${testid}-field-email`}
                type="email"
              />
            </div>

            <div className="ls-signup-form__field">
              <label className="ls-signup-form__label">{t('label.password', { ns: 'auth' })}</label>
              <Input
                type="password"
                name="password"
                maxlength={30}
                autocomplete="new-password"
                className="ls-signup-form__input"
                data-testid={`${testid}-field-password`}
              >
                <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
              </Input>
            </div>

            <div className="ls-signup-form__field">
              <label className="ls-signup-form__label">{t('label.confirm-password', { ns: 'auth' })}</label>
              <Input
                type="password"
                name="confirmPassword"
                maxlength={30}
                autocomplete="new-password"
                className="ls-signup-form__input"
                data-testid={`${testid}-field-confirm-password`}
              >
                <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
              </Input>
            </div>

            <PasswordGuidelines password={values.password || ''} />

            <IonButton
              type="submit"
              color="primary"
              className="ls-signup-form__button"
              expand="block"
              disabled={isSubmitting || !dirty || isSignUpLoading || isLoading || !isValid}
              data-testid={`${testid}-button-submit`}
            >
              {isLoading ? t('signing-up', { ns: 'auth' }) : t('signup', { ns: 'auth' })}
            </IonButton>
            
            <div className="ls-signup-form__signup-login">
              <span>{t('already-have-account', { ns: 'auth' })} </span>
              <Link to="/auth/signin" className="ls-signup-form__link">{t('signin', { ns: 'auth' })}</Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default SignUpForm; 