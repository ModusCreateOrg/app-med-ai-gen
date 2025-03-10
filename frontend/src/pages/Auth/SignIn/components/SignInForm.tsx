import {
  IonButton,
  IonContent,
  IonInputPasswordToggle,
  IonPopover,
  useIonRouter,
  useIonViewDidEnter,
  IonText,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useRef, useState } from 'react';
import classNames from 'classnames';
import { Form, Formik } from 'formik';
import { boolean, object, string } from 'yup';
import { useTranslation } from 'react-i18next';

import './SignInForm.scss';
import { BaseComponentProps } from 'common/components/types';
import { RememberMe } from 'common/models/auth';
import storage from 'common/utils/storage';
import { StorageKey } from 'common/utils/constants';
import { useSignIn } from 'common/hooks/useAuth';
import { useProgress } from 'common/hooks/useProgress';
import Input from 'common/components/Input/Input';
import ErrorCard from 'common/components/Card/ErrorCard';
import Icon from 'common/components/Icon/Icon';
import HeaderRow from 'common/components/Text/HeaderRow';
import CheckboxInput from 'common/components/Input/CheckboxInput';
import { useSocialSignIn } from 'common/hooks/useAuth';
import { getAuthErrorMessage } from 'common/utils/auth-errors';

/**
 * Properties for the `SignInForm` component.
 */
interface SignInFormProps extends BaseComponentProps {}

/**
 * Sign in form values.
 * @param {string} email - User's email.
 * @param {string} password - A password.
 */
interface SignInFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * The `SignInForm` component renders a Formik form for user authentication.
 * @param {SignInFormProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const SignInForm = ({ className, testid = 'form-signin' }: SignInFormProps): JSX.Element => {
  const focusInput = useRef<HTMLIonInputElement>(null);
  const [error, setError] = useState<string>('');
  const { setIsActive: setShowProgress } = useProgress();
  const router = useIonRouter();
  const { signIn, isLoading } = useSignIn();
  const { signInWithGoogle, signInWithApple } = useSocialSignIn();
  const { t } = useTranslation();

  /**
   * Sign in form validation schema.
   */
  const validationSchema = object<SignInFormValues>({
    email: string()
      .email(t('validation.email'))
      .required(t('validation.required')),
    password: string().required(t('validation.required')),
    rememberMe: boolean().default(false),
  });

  // remember me details
  const rememberMe = storage.getJsonItem<RememberMe>(StorageKey.RememberMe);

  useIonViewDidEnter(() => {
    focusInput.current?.setFocus();
  });

  // Handle sign in with Google
  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setShowProgress(true);
      await signInWithGoogle();
      router.push('/tabs', 'forward', 'replace');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setShowProgress(false);
    }
  };

  // Handle sign in with Apple
  const handleAppleSignIn = async () => {
    try {
      setError('');
      setShowProgress(true);
      await signInWithApple();
      router.push('/tabs', 'forward', 'replace');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setShowProgress(false);
    }
  };

  return (
    <div className={classNames('ls-signin-form', className)} data-testid={testid}>
      {error && (
        <ErrorCard
          content={`${t('error.unable-to-verify', { ns: 'auth' })} ${error}`}
          className="ion-margin-bottom"
          testid={`${testid}-error`}
        />
      )}

      <Formik<SignInFormValues>
        enableReinitialize={true}
        initialValues={{
          email: rememberMe?.username ?? '',
          password: '',
          rememberMe: !!rememberMe,
        }}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setError('');
            setShowProgress(true);
            await signIn(values.email, values.password);
            
            if (values.rememberMe) {
              storage.setJsonItem<RememberMe>(StorageKey.RememberMe, {
                username: values.email,
              });
            } else {
              storage.removeItem(StorageKey.RememberMe);
            }
            
            router.push('/tabs', 'forward', 'replace');
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
              <div>{t('signin', { ns: 'auth' })}</div>
              <Icon id="signinInfo" icon="circleInfo" color="secondary" />
            </HeaderRow>

            <Input
              name="email"
              label={t('label.email', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={50}
              autocomplete="email"
              className="ls-signin-form__input"
              ref={focusInput}
              data-testid={`${testid}-field-email`}
              type="email"
            />
            <Input
              type="password"
              name="password"
              label={t('label.password', { ns: 'auth' })}
              labelPlacement="stacked"
              maxlength={30}
              autocomplete="current-password"
              className="ls-signin-form__input"
              data-testid={`${testid}-field-password`}
            >
              <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
            </Input>

            <CheckboxInput
              name="rememberMe"
              className="ls-signin-form__input ls-signin-form__input-checkbox"
              testid={`${testid}-field-rememberme`}
            >
              {t('label.remember-me', { ns: 'auth' })}
            </CheckboxInput>

            <IonButton
              type="submit"
              color="primary"
              className="ls-signin-form__button"
              expand="block"
              disabled={isSubmitting || !dirty || isLoading}
              data-testid={`${testid}-button-submit`}
            >
              {t('signin', { ns: 'auth' })}
            </IonButton>

            <IonRow className="ion-text-center ion-padding">
              <IonCol>
                <IonText color="medium">
                  {t('or-signin-with', { ns: 'auth' })}
                </IonText>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol>
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  data-testid={`${testid}-button-google`}
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
                  onClick={handleAppleSignIn}
                  disabled={isLoading}
                  data-testid={`${testid}-button-apple`}
                >
                  <Icon icon="apple" slot="start" />
                  Apple
                </IonButton>
              </IonCol>
            </IonRow>
            
            <IonRow className="ion-text-center ion-padding-top">
              <IonCol>
                <IonText color="medium">
                  {t('no-account', { ns: 'auth' })}{' '}
                  <a href="/auth/signup">{t('signup', { ns: 'auth' })}</a>
                </IonText>
              </IonCol>
            </IonRow>

            <IonPopover
              trigger="signinInfo"
              triggerAction="hover"
              className="ls-signin-form-popover"
            >
              <IonContent className="ion-padding">
                <p>
                  {t('info-email.part1', { ns: 'auth' })}
                </p>
                <p>
                  {t('info-email.part2', { ns: 'auth' })}
                </p>
              </IonContent>
            </IonPopover>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default SignInForm;
