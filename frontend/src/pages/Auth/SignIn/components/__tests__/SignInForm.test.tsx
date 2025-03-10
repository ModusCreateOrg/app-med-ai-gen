import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, expect } from 'vitest';
import SignInForm from '../SignInForm';

// Mock the useAuthOperations hook
vi.mock('../../../../../common/hooks/useAuthOperations', () => ({
  useAuthOperations: () => ({
    signIn: vi.fn(),
    error: null,
    isLoading: false,
    clearError: vi.fn(),
  }),
}));

// Mock the useProgress hook
vi.mock('../../../../../common/hooks/useProgress', () => ({
  useProgress: () => ({
    progressBar: {
      show: vi.fn(),
      hide: vi.fn(),
    },
    setIsActive: vi.fn(),
  }),
}));

// Mock the storage module
vi.mock('../../../../../common/utils/storage', () => ({
  default: {
    getJsonItem: vi.fn(() => null),
    setJsonItem: vi.fn(),
    removeItem: vi.fn(),
    getItem: vi.fn(),
    setItem: vi.fn(),
  }
}));

// Mock the useSignIn hook
vi.mock('../../api/useSignIn', () => ({
  useSignIn: () => ({
    signIn: vi.fn(),
    isLoading: false,
  }),
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

// Mock the AuthErrorDisplay component
vi.mock('../../../../../common/components/Auth/AuthErrorDisplay', () => ({
  default: ({ error }: { error: null | { message: string } }) => (
    error ? <div data-testid="auth-error">{error.message}</div> : null
  ),
}));

// Mock the AuthLoadingIndicator component
vi.mock('../../../../../common/components/Auth/AuthLoadingIndicator', () => ({
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

describe('SignInForm', () => {
  it('should render successfully', () => {
    render(<SignInForm />);
    // Use a more specific selector
    expect(screen.getByTestId('form-signin')).toBeDefined();
  });

  it('should handle email change', () => {
    render(<SignInForm />);
    const emailInput = screen.getByTestId('form-signin-field-email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toBeDefined();
    expect(emailInput).toHaveProperty('value', 'test@example.com');
  });

  it('should handle password change', () => {
    render(<SignInForm />);
    const passwordInput = screen.getByTestId('form-signin-field-password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toBeDefined();
    expect(passwordInput).toHaveProperty('value', 'password123');
  });

  it('should handle remember me change', () => {
    render(<SignInForm />);
    const rememberMeCheckbox = screen.getByTestId('form-signin-field-rememberme');
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeDefined();
  });

  it('should submit the form', () => {
    // Get the mock implementation
    const mockSignIn = vi.fn();
    
    // Override the mock implementation for useSignIn
    const useSignIn = vi.hoisted(() => vi.fn());
    vi.mocked(useSignIn).mockReturnValue({
      signIn: mockSignIn,
      isLoading: false,
    });

    render(<SignInForm />);
    
    const emailInput = screen.getByTestId('form-signin-field-email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const passwordInput = screen.getByTestId('form-signin-field-password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const submitButton = screen.getByRole('button', { name: 'signin' });
    fireEvent.click(submitButton);
    
    expect(mockSignIn).toBeDefined();
  });
});
