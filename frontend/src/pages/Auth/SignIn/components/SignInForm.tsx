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
import { AuthError, RememberMe } from 'common/models/auth';
import storage from 'common/utils/storage';
import { StorageKey } from 'common/utils/constants';
import { useSignIn } from 'common/hooks/useAuth';
import { useProgress } from 'common/hooks/useProgress';
import Input from 'common/components/Input/Input';
import Icon from 'common/components/Icon/Icon';
import HeaderRow from 'common/components/Text/HeaderRow';
import CheckboxInput from 'common/components/Input/CheckboxInput';
import SocialLoginButtons from 'common/components/SocialLogin/SocialLoginButtons';
import { formatAuthError } from 'common/utils/auth-errors';
import AuthErrorDisplay from 'common/components/Auth/AuthErrorDisplay';
import AuthLoadingIndicator from 'common/components/Auth/AuthLoadingIndicator';

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
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setIsActive: setShowProgress } = useProgress();
  const router = useIonRouter();
  const { signIn, isLoading: isSignInLoading } = useSignIn();
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

  return (
    <div className={classNames('ls-signin-form', className)} data-testid={testid}>
      <AuthErrorDisplay 
        error={error} 
        showDetails={true}
        className="ion-margin-bottom"
        testid={`${testid}-error`}
      />

      <AuthLoadingIndicator 
        isLoading={isLoading} 
        message={t('signin.loading', { ns: 'auth' })}
        testid={`${testid}-loading`}
      />

      <Formik<SignInFormValues>
        enableReinitialize={true}
        initialValues={{
          email: rememberMe?.username ?? '',
          password: '',
          rememberMe: !!rememberMe,
        }}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setError(null);
            setIsLoading(true);
            setShowProgress(true);
            await signIn(values.email, values.password);
            
            if (values.rememberMe) {
              storage.setJsonItem<RememberMe>(StorageKey.RememberMe, {
                username: values.email,
              });
            } else {
              storage.removeItem(StorageKey.RememberMe);
            }
            
            // Show success message before redirecting
            setIsLoading(false);
            router.push('/tabs', 'forward', 'replace');
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
              disabled={isSubmitting || !dirty || isSignInLoading || isLoading}
              data-testid={`${testid}-button-submit`}
            >
              {t('signin', { ns: 'auth' })}
            </IonButton>

            <SocialLoginButtons 
              className="ls-signin-form__social-buttons" 
              disabled={isSubmitting || isLoading} 
              testid={`${testid}-social-buttons`}
            />
            
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
