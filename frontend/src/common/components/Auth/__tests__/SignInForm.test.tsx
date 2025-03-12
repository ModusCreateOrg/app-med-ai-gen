import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, expect } from 'vitest';
import SignInForm from '../../../../pages/Auth/SignIn/components/SignInForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create hoisted mocks for useSignIn and useCurrentUser
const mockSignIn = vi.fn();

// Mock the useAuthOperations hook
vi.mock('../../../../hooks/useAuthOperations', () => ({
  useAuthOperations: () => ({
    signIn: vi.fn(),
    error: null,
    isLoading: false,
    clearError: vi.fn(),
  }),
}));

// Mock the useProgress hook
vi.mock('../../../../hooks/useProgress', () => ({
  useProgress: () => ({
    progressBar: {
      show: vi.fn(),
      hide: vi.fn(),
    },
    setIsActive: vi.fn(),
  }),
}));

// Mock the storage module
vi.mock('../../../../utils/storage', () => ({
  default: {
    getJsonItem: vi.fn(() => null),
    setJsonItem: vi.fn(),
    removeItem: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
  }
}));

// Mock the @ionic/react components
vi.mock('@ionic/react', () => {
  const IonButton = ({ onClick, children, type }: { onClick?: () => void; children: React.ReactNode; type?: "button" | "submit" | "reset" }) => (
    <button onClick={onClick} type={type}>
      {children}
    </button>
  );

  const IonItem = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const IonLabel = ({ children }: { children: React.ReactNode }) => <label>{children}</label>;
  const IonInput = ({ 
    value, 
    onIonChange, 
    type, 
    placeholder,
    "data-testid": dataTestId,
  }: { 
    value?: string; 
    onIonChange?: (e: { detail: { value: string } }) => void; 
    type?: string; 
    placeholder?: string;
    "data-testid"?: string;
  }) => {
    // Create a mutable ref to store the value
    const [currentValue, setCurrentValue] = React.useState(value || '');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentValue(e.target.value);
      onIonChange?.({ detail: { value: e.target.value } });
    };
    
    return (
      <input
        value={currentValue}
        onChange={handleChange}
        type={type}
        placeholder={placeholder}
        data-testid={dataTestId}
      />
    );
  };

  const IonText = ({ children, color }: { children: React.ReactNode; color?: string }) => (
    <div style={{ color }}>{children}</div>
  );

  const IonRow = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const IonCol = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const IonList = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const IonGrid = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const IonCheckbox = ({ 
    checked, 
    onIonChange,
    "data-testid": dataTestId,
  }: { 
    checked?: boolean; 
    onIonChange?: (e: { detail: { checked: boolean } }) => void;
    "data-testid"?: string;
  }) => {
    // Create a mutable ref to store the checked state
    const [isChecked, setIsChecked] = React.useState(checked || false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(e.target.checked);
      onIonChange?.({ detail: { checked: e.target.checked } });
    };
    
    return (
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        data-testid={dataTestId}
      />
    );
  };

  const IonInputPasswordToggle = ({ 
    value, 
    onIonChange, 
    placeholder,
    "data-testid": dataTestId,
  }: { 
    value?: string; 
    onIonChange?: (e: { detail: { value: string } }) => void; 
    placeholder?: string;
    "data-testid"?: string;
  }) => {
    // Create a mutable ref to store the value
    const [currentValue, setCurrentValue] = React.useState(value || '');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentValue(e.target.value);
      onIonChange?.({ detail: { value: e.target.value } });
    };
    
    return (
      <input
        value={currentValue}
        onChange={handleChange}
        type="password"
        placeholder={placeholder}
        data-testid={dataTestId}
      />
    );
  };

  // Add more components
  const IonPopover = ({ children, trigger, triggerAction }: { children: React.ReactNode; trigger?: string; triggerAction?: string }) => (
    <div data-testid="ion-popover" data-trigger={trigger} data-trigger-action={triggerAction}>
      {children}
    </div>
  );

  const IonContent = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ion-content">{children}</div>
  );

  // Add useIonRouter mock
  const useIonRouter = () => ({
    push: vi.fn(),
    back: vi.fn(),
    canGoBack: () => true,
  });

  // Add useIonViewDidEnter mock
  const useIonViewDidEnter = (callback: () => void) => {
    // Call the callback immediately in the test
    setTimeout(callback, 0);
  };

  return {
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonText,
    IonRow,
    IonCol,
    IonList,
    IonGrid,
    IonCheckbox,
    IonInputPasswordToggle,
    IonPopover,
    IonContent,
    useIonRouter,
    useIonViewDidEnter,
  };
});

// Mock the useSignIn hook
vi.mock('../../../../pages/Auth/SignIn/api/useSignIn', () => ({
  useSignIn: () => ({
    signIn: vi.fn(),
    isLoading: false,
  }),
}));

// Mock the useGetUserTokens hook
vi.mock('../../../../common/api/useGetUserTokens', () => ({
  useGetUserTokens: () => ({
    isSuccess: false,
    refetch: vi.fn(),
  }),
}));

// Mock the useAuth hooks
vi.mock('../../../../common/hooks/useAuth', () => ({
  useSignIn: () => ({
    signIn: mockSignIn,
    isLoading: false,
    error: null,
  }),
  useCurrentUser: () => ({
    data: null,
    isLoading: false,
  }),
  // Removed useSocialSignIn mock
}));

// Mock the AuthErrorDisplay component
vi.mock('../AuthErrorDisplay', () => ({
  default: ({ error }: { error: null | { message: string } }) => (
    error ? <div data-testid="auth-error">{error.message}</div> : null
  ),
}));

// Mock the AuthLoadingIndicator component
vi.mock('../AuthLoadingIndicator', () => ({
  default: ({ isLoading }: { isLoading: boolean }) => (
    isLoading ? <div data-testid="loading-indicator">Loading...</div> : null
  ),
}));

// Mock the useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Create a custom render function that includes the QueryClientProvider
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithQueryClient = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('SignInForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    renderWithQueryClient(<SignInForm />);
    // Use a more specific selector
    expect(screen.getByTestId('form-signin')).toBeDefined();
  });

  it('should handle email change', () => {
    renderWithQueryClient(<SignInForm />);
    const emailInput = screen.getByTestId('form-signin-field-email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toBeDefined();
    expect(emailInput).toHaveProperty('value', 'test@example.com');
  });

  it('should handle password change', () => {
    renderWithQueryClient(<SignInForm />);
    const passwordInput = screen.getByTestId('form-signin-field-password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toBeDefined();
    expect(passwordInput).toHaveProperty('value', 'password123');
  });

  it('should handle remember me change', () => {
    renderWithQueryClient(<SignInForm />);
    const rememberMeCheckbox = screen.getByTestId('form-signin-field-rememberme');
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeDefined();
  });
}); 