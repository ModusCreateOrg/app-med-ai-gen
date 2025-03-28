import {
  IonButton,
  IonInputPasswordToggle,
  useIonRouter,
  useIonViewDidEnter,
} from '@ionic/react';
import { useRef, useState, useEffect } from 'react';
import classNames from 'classnames';
import { Form, Formik } from 'formik';
import { boolean, object, string } from 'yup';
import { useTranslation } from 'react-i18next';

import './SignInForm.scss';
import { BaseComponentProps } from 'common/components/types';
import { AuthError, RememberMe } from 'common/models/auth';
import storage from 'common/utils/storage';
import { StorageKey } from 'common/utils/constants';
import { useSignIn, useCurrentUser } from 'common/hooks/useAuth';
import { useProgress } from 'common/hooks/useProgress';
import Input from 'common/components/Input/Input';
import CheckboxInput from 'common/components/Input/CheckboxInput';
import { formatAuthError } from 'common/utils/auth-errors';
import AuthErrorDisplay from 'common/components/Auth/AuthErrorDisplay';
import AuthLoadingIndicator from 'common/components/Auth/AuthLoadingIndicator';
import { useGetUserTokens } from 'common/api/useGetUserTokens';

/**
 * Properties for the `SignInForm` component.
 */
interface SignInFormProps extends BaseComponentProps {}

/**
 * Sign in form values.
 * @param {string} email - User's email.
 * @param {string} password - A password.
 * @param {boolean} rememberMe - Whether to remember the user's credentials.
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
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isSignInComplete, setIsSignInComplete] = useState(false);
  const { setIsActive: setShowProgress } = useProgress();
  const router = useIonRouter();
  const { signIn, isLoading: isSignInLoading } = useSignIn();
  const { t } = useTranslation();
  const currentUser = useCurrentUser();
  const { isSuccess: hasTokens, refetch: refetchTokens } = useGetUserTokens();

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

  // Effect to handle redirection after sign-in is complete and user data is available
  useEffect(() => {
    if (isSignInComplete && shouldRedirect && currentUser && hasTokens) {
      console.log('User data loaded, redirecting to home');
      setIsLoading(false);
      router.push('/tabs/home', 'forward', 'replace');
    }
  }, [isSignInComplete, shouldRedirect, currentUser, hasTokens, router]);

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
            setShouldRedirect(false);
            setIsSignInComplete(false);
            
            const result = await signIn(values.email, values.password);
            
            // Check if user is already signed in
            if (result.alreadySignedIn) {
              // User is already signed in, but we still need to wait for user data
              console.log('User is already signed in, waiting for user data');
              // Trigger a token refresh to ensure we have the latest user data
              await refetchTokens();
              setIsSignInComplete(true);
              setShouldRedirect(true);
              return;
            }
            
            if (values.rememberMe) {
              storage.setJsonItem<RememberMe>(StorageKey.RememberMe, {
                username: values.email,
              });
            } else {
              storage.removeItem(StorageKey.RememberMe);
            }
            
            // Trigger a token refresh to ensure we have the latest user data
            await refetchTokens();
            setIsSignInComplete(true);
            setShouldRedirect(true);
            
            // The redirection will happen in the useEffect when user data is available
          } catch (err) {
            setError(formatAuthError(err));
            setIsLoading(false);
          } finally {
            setShowProgress(false);
            setSubmitting(false);
          }
        }}
        validationSchema={validationSchema}
      >
        {({ dirty, isSubmitting }) => (
          <Form data-testid={`${testid}-form`}>
            <div className="ls-signin-form__field">
              <label className="ls-signin-form__label">{t('label.email', { ns: 'auth' })}</label>
              <Input
                name="email"
                maxlength={50}
                autocomplete="email"
                className="ls-signin-form__input"
                ref={focusInput}
                data-testid={`${testid}-field-email`}
                type="email"
                placeholder=""
              />
            </div>
            
            <div className="ls-signin-form__field">
              <label className="ls-signin-form__label">{t('label.password', { ns: 'auth' })}</label>
              <Input
                type="password"
                name="password"
                maxlength={30}
                autocomplete="current-password"
                className="ls-signin-form__input"
                data-testid={`${testid}-field-password`}
                placeholder=""
              >
                <IonInputPasswordToggle slot="end" />
              </Input>
            </div>

            <div className="ls-signin-form__remember-forgot">
              <div className="ls-signin-form__remember">
                <CheckboxInput
                  name="rememberMe"
                  className="ls-signin-form__input-checkbox"
                  testid={`${testid}-field-rememberme`}
                  labelPlacement='end'
                >
                  {t('label.remember-me', { ns: 'auth' })}
                </CheckboxInput>
              </div>

              <a 
                href="/auth/forgot-password" 
                className="ls-signin-form__forgot-link"
                data-testid={`${testid}-link-forgot-password`}
              >
                {t('forgot-password', { ns: 'auth' })}
              </a>
            </div>

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

            <div className="ls-signin-form__signup">
              <span>{t('no-account', { ns: 'auth' })} </span>
              <a href="/auth/signup">{t('signup', { ns: 'auth' })}</a>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default SignInForm;
