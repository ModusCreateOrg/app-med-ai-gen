import {
  IonButton,
  IonInputPasswordToggle,
  useIonRouter,
  useIonViewDidEnter,
  IonText,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useRef, useState } from 'react';
import classNames from 'classnames';
import { Form, Formik } from 'formik';
import { object, string, ref } from 'yup';
import { useTranslation } from 'react-i18next';

import './SignUpForm.scss';
import { BaseComponentProps } from 'common/components/types';
import { useSignUp } from 'common/hooks/useAuth';
import { useProgress } from 'common/hooks/useProgress';
import Input from 'common/components/Input/Input';
import ErrorCard from 'common/components/Card/ErrorCard';
import HeaderRow from 'common/components/Text/HeaderRow';
import { getAuthErrorMessage } from 'common/utils/auth-errors';

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
  const [error, setError] = useState<string>('');
  const { setIsActive: setShowProgress } = useProgress();
  const router = useIonRouter();
  const { signUp, isLoading } = useSignUp();
  const { t } = useTranslation();

  /**
   * Sign up form validation schema.
   */
  const validationSchema = object({
    email: string()
      .email(t('validation.email'))
      .required(t('validation.required')),
    firstName: string()
      .min(2, t('validation.min-length', { length: 2 }))
      .max(50, t('validation.max-length', { length: 50 }))
      .required(t('validation.required')),
    lastName: string()
      .min(2, t('validation.min-length', { length: 2 }))
      .max(50, t('validation.max-length', { length: 50 }))
      .required(t('validation.required')),
    password: string()
      .min(8, t('validation.min-length', { length: 8 }))
      .required(t('validation.required')),
    confirmPassword: string()
      .oneOf([ref('password')], t('validation.passwords-match'))
      .required(t('validation.required')),
  });

  useIonViewDidEnter(() => {
    focusInput.current?.setFocus();
  });

  return (
    <div className={classNames('ls-signup-form', className)} data-testid={testid}>
      {error && (
        <ErrorCard
          content={error}
          className="ion-margin-bottom"
          testid={`${testid}-error`}
        />
      )}

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
            setError('');
            setShowProgress(true);
            await signUp(values.email, values.password, values.firstName, values.lastName);
            
            // If no error, redirect to sign in page
            router.push('/auth/signin', 'forward', 'replace');
          } catch (err) {
            setError(getAuthErrorMessage(err));
          } finally {
            setShowProgress(false);
            setSubmitting(false);
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
              disabled={isSubmitting || !dirty || isLoading}
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