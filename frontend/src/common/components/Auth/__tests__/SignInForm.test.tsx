import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, expect } from 'vitest';
import SignInForm from 'pages/Auth/SignIn/components/SignInForm';

// Mock the useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

// Mock the useAuthOperations hook
const mockSignIn = vi.fn();
vi.mock('common/hooks/useAuthOperations', () => ({
  useAuthOperations: () => ({
    signIn: mockSignIn,
    error: null,
    isLoading: false
  })
}));

// Mock the useProgress hook
vi.mock('common/hooks/useProgress', () => ({
  useProgress: () => ({
    start: vi.fn(),
    done: vi.fn(),
    active: false,
    progress: 0,
    animation: 'ease',
    className: '',
    startPosition: 0.3,
    initialPosition: 0.1
  })
}));

describe('SignInForm', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it('renders the form', () => {
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText(/auth.email/i);
    const passwordInput = screen.getByLabelText(/auth.password/i);
    const submitButton = screen.getByRole('button', { name: /auth.signIn/i });
    
    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
    expect(submitButton).toBeDefined();
  });

  it('validates email and password inputs', async () => {
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText(/auth.email/i);
    const passwordInput = screen.getByLabelText(/auth.password/i);
    const submitButton = screen.getByRole('button', { name: /auth.signIn/i });
    
    // Submit with empty fields
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Should show validation errors
      expect(screen.getByText(/auth.validation.emailRequired/i)).toBeDefined();
      expect(screen.getByText(/auth.validation.passwordRequired/i)).toBeDefined();
    });
    
    // Enter invalid email format
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/auth.validation.emailFormat/i)).toBeDefined();
    });
    
    // Enter valid email but short password
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/auth.validation.passwordLength/i)).toBeDefined();
    });
  });

  it('submits the form with valid data', async () => {
    render(<SignInForm />);
    
    const emailInput = screen.getByLabelText(/auth.email/i);
    const passwordInput = screen.getByLabelText(/auth.password/i);
    const submitButton = screen.getByRole('button', { name: /auth.signIn/i });
    
    // Enter valid credentials
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'Password123');
    });
  });

  it('applies custom className', () => {
    const customClass = 'custom-form-class';
    render(<SignInForm className={customClass} />);
    
    const form = screen.getByTestId('sign-in-form');
    expect(form.className).toContain(customClass);
  });

  it('accepts custom testid', () => {
    const customTestId = 'custom-sign-in-form';
    render(<SignInForm testid={customTestId} />);
    
    const form = screen.getByTestId(customTestId);
    expect(form).toBeDefined();
  });
}); 