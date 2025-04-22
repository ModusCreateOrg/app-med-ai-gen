import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignInForm from '../SignInForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('../../../../../common/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),
  useSignIn: () => ({
    signIn: vi.fn(),
    isLoading: false,
    error: null,
  }),
  useCurrentUser: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../../../../common/api/useGetUserTokens', () => ({
  useGetUserTokens: () => ({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../../../../common/hooks/useProgress', () => ({
  useProgress: () => ({
    showProgress: vi.fn(),
    hideProgress: vi.fn(),
    setIsActive: vi.fn(),
  }),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock the components
vi.mock('@ionic/react', () => ({
  IonButton: ({
    onClick,
    children,
    type,
    disabled,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  IonContent: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div data-testid="ion-content" {...props}>
      {children}
    </div>
  ),
  IonInputPasswordToggle: () => <div data-testid="password-toggle">Toggle</div>,
  IonPopover: ({
    children,
    trigger,
    triggerAction,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    trigger?: string;
    triggerAction?: string;
  }) => (
    <div
      data-testid="ion-popover"
      data-trigger={trigger}
      data-trigger-action={triggerAction}
      {...props}
    >
      {children}
    </div>
  ),
  useIonRouter: () => ({
    push: vi.fn(),
  }),
  useIonViewDidEnter: vi.fn((callback) => callback()),
  IonText: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  IonRow: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
  IonCol: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div {...props}>{children}</div>
  ),
}));

// Create a wrapper with QueryClientProvider
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

// Mock the custom components
vi.mock('../../../../../common/components/Input/Input', () => ({
  default: ({
    name,
    label,
    type,
    maxlength,
    autocomplete,
    className,
    'data-testid': dataTestId,
    children,
  }: {
    name: string;
    label: string;
    type?: string;
    maxlength?: number;
    autocomplete?: string;
    className?: string;
    'data-testid'?: string;
    children?: React.ReactNode;
  }) => (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        maxLength={maxlength}
        autoComplete={autocomplete}
        className={className}
        data-testid={dataTestId}
      />
      {children}
    </div>
  ),
}));

vi.mock('../../../../../common/components/Input/CheckboxInput', () => ({
  default: ({
    name,
    className,
    testid,
    children,
  }: {
    name: string;
    className?: string;
    testid?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <input type="checkbox" id={name} name={name} className={className} data-testid={testid} />
      <label htmlFor={name}>{children}</label>
    </div>
  ),
}));

vi.mock('../../../../../common/components/Icon/Icon', () => ({
  default: ({ id, icon, color }: { id?: string; icon?: string; color?: string }) => (
    <span id={id} data-icon={icon} data-color={color}>
      Icon
    </span>
  ),
}));

vi.mock('../../../../../common/components/Text/HeaderRow', () => ({
  default: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
    <div data-testid="header-row" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('../../../../../common/components/Auth/AuthErrorDisplay', () => ({
  default: ({ error, testid }: { error: { message: string } | null; testid?: string }) =>
    error ? <div data-testid={testid}>{error.message}</div> : null,
}));

vi.mock('../../../../../common/components/Auth/AuthLoadingIndicator', () => ({
  default: ({
    isLoading,
    message,
    testid,
  }: {
    isLoading: boolean;
    message?: string;
    testid?: string;
  }) => (isLoading ? <div data-testid={testid}>{message}</div> : null),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    renderWithQueryClient(<SignInForm />);
    expect(screen.getByTestId('form-signin')).toBeDefined();
  });

  it('should render email and password fields', () => {
    renderWithQueryClient(<SignInForm />);
    expect(screen.getByTestId('form-signin-field-email')).toBeDefined();
    expect(screen.getByTestId('form-signin-field-password')).toBeDefined();
  });

  it('should render remember me checkbox', () => {
    renderWithQueryClient(<SignInForm />);
    expect(screen.getByTestId('form-signin-field-rememberme')).toBeDefined();
  });

  it('should render submit button', () => {
    renderWithQueryClient(<SignInForm />);
    expect(screen.getByRole('button', { name: 'signin' })).toBeDefined();
  });
});
