import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SignInForm from '../SignInForm';
import { AuthError } from '../../../../../common/services/auth/types';
import { useAuthOperations } from '../../../../../common/hooks/useAuthOperations';

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
  }) => (
    <input
      value={value}
      onChange={(e) => onIonChange?.({ detail: { value: e.target.value } })}
      type={type}
      placeholder={placeholder}
      data-testid={dataTestId}
    />
  );

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
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onIonChange?.({ detail: { checked: e.target.checked } })}
      data-testid={dataTestId}
    />
  );

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
  }) => (
    <input
      value={value}
      onChange={(e) => onIonChange?.({ detail: { value: e.target.value } })}
      type="password"
      placeholder={placeholder}
      data-testid={dataTestId}
    />
  );

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
  };
});

// Mock the AuthErrorDisplay component
vi.mock('../../../../../common/components/Auth/AuthErrorDisplay', () => ({
  default: ({ error }: { error: AuthError | null }) => (
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
    expect(screen.getByText('auth.signIn.title')).toBeInTheDocument();
  });

  it('should handle email change', () => {
    render(<SignInForm />);
    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should handle password change', () => {
    render(<SignInForm />);
    const passwordInput = screen.getByTestId('password-input');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
  });

  it('should handle remember me change', () => {
    render(<SignInForm />);
    const rememberMeCheckbox = screen.getByTestId('remember-me');
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
  });

  it('should submit the form', () => {
    // Mock the useAuthOperations hook
    const mockSignIn = vi.fn();
    vi.mocked(useAuthOperations).mockReturnValue({
      signIn: mockSignIn,
      error: null,
      isLoading: false,
      clearError: vi.fn(),
    });

    render(<SignInForm />);
    
    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const passwordInput = screen.getByTestId('password-input');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const submitButton = screen.getByText('auth.signIn.button');
    fireEvent.click(submitButton);
    
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
