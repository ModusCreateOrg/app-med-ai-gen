import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect } from 'vitest';
import SignInForm from '../SignInForm';
import * as AuthHooks from 'common/hooks/useAuth';
import * as ProgressHooks from 'common/hooks/useProgress';
import * as StorageUtils from 'common/utils/storage';

// Mock IonReactRouter hook
vi.mock('@ionic/react', () => {
  const originalModule = vi.importActual('@ionic/react');
  return {
    ...originalModule,
    useIonRouter: () => ({
      push: vi.fn(),
    }),
    useIonViewDidEnter: vi.fn((callback) => callback()),
  };
});

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Simplified translation mocking for testing
      const translations: Record<string, string> = {
        'signin': 'Sign In',
        'label.email': 'Email Address',
        'label.password': 'Password',
        'label.remember-me': 'Remember Me',
        'validation.email': 'Invalid email',
        'validation.required': 'Required',
        'signin.loading': 'Signing in...',
      };
      return translations[key] || key;
    }
  })
}));

// Mock components
vi.mock('common/components/Auth/AuthErrorDisplay', () => ({
  default: ({ error, testid }: { error: Error | string | null; testid: string }) => (
    error ? <div data-testid={testid}>Error: {JSON.stringify(error)}</div> : null
  )
}));

vi.mock('common/components/Auth/AuthLoadingIndicator', () => ({
  default: ({ isLoading, testid }: { isLoading: boolean; testid: string }) => (
    isLoading ? <div data-testid={testid}>Loading</div> : null
  )
}));

vi.mock('common/components/SocialLogin/SocialLoginButtons', () => ({
  default: ({ testid }: { testid: string }) => <div data-testid={testid}>Social Buttons</div>
}));

// Mock storage
vi.mock('common/utils/storage', () => ({
  default: {
    getJsonItem: vi.fn(),
    setJsonItem: vi.fn(),
    removeItem: vi.fn(),
  }
}));

describe('SignInForm', () => {
  // Setup mocks
  const mockSignIn = vi.fn();
  const mockSetIsActive = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useSignIn hook
    vi.spyOn(AuthHooks, 'useSignIn').mockReturnValue({
      signIn: mockSignIn,
      isLoading: false
    });
    
    // Mock useProgress hook
    vi.spyOn(ProgressHooks, 'useProgress').mockReturnValue({
      setIsActive: mockSetIsActive,
      isActive: false,
      progressBar: {
        value: 0,
        color: 'primary',
        buffer: 0,
        reversed: false,
        type: 'determinate'
      },
      setProgressBar: vi.fn(),
      setProgress: vi.fn()
    });
    
    // Mock storage
    vi.spyOn(StorageUtils.default, 'getJsonItem').mockReturnValue(null);
  });
  
  it('should render the sign-in form', () => {
    render(<SignInForm />);
    
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByLabelText(/Email Address/i)).toBeTruthy();
    expect(screen.getByLabelText(/Password/i)).toBeTruthy();
    expect(screen.getByText(/Remember Me/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeTruthy();
    expect(screen.getByTestId('form-signin-social-buttons')).toBeTruthy();
  });
  
  it('should validate form inputs', async () => {
    render(<SignInForm />);
    
    // Try to submit without filling the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Validation messages should appear
    await waitFor(() => {
      expect(screen.getAllByText(/Required/i).length).toBeGreaterThan(0);
    });
  });
  
  it('should call signIn when form is submitted with valid data', async () => {
    render(<SignInForm />);
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Email Address/i), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Password/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check if signIn was called with correct params
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockSetIsActive).toHaveBeenCalledWith(true);
    });
  });
  
  it('should handle remember me checkbox', async () => {
    render(<SignInForm />);
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Email Address/i), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Password/i), { 
      target: { value: 'password123' } 
    });
    
    // Check the remember me box
    fireEvent.click(screen.getByLabelText(/Remember Me/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Mock successful sign-in
    mockSignIn.mockResolvedValueOnce({});
    
    // Check if storage is called
    await waitFor(() => {
      expect(StorageUtils.default.setJsonItem).toHaveBeenCalled();
    });
  });
  
  it('should handle sign-in errors', async () => {
    // Mock signIn to throw an error
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
    
    render(<SignInForm />);
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Email Address/i), { 
      target: { value: 'test@example.com' } 
    });
    
    fireEvent.change(screen.getByLabelText(/Password/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check if error is displayed
    await waitFor(() => {
      expect(screen.getByTestId('form-signin-error')).toBeTruthy();
    });
  });
});
