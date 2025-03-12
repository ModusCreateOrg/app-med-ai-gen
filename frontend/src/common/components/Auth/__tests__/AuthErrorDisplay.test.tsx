import { render, screen } from '@testing-library/react';
import { vi, expect } from 'vitest';
import AuthErrorDisplay from '../AuthErrorDisplay';
import { AuthError } from 'common/models/auth';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Return the key as the translation for testing
      if (key === 'error.details') return 'Error details';
      return key;
    }
  })
}));

describe('AuthErrorDisplay', () => {
  it('should not render when error is null', () => {
    const { container } = render(<AuthErrorDisplay error={null} />);
    expect(container.firstChild).toEqual(null);
  });

  it('should not render when error is undefined', () => {
    const { container } = render(<AuthErrorDisplay error={undefined} />);
    expect(container.firstChild).toEqual(null);
  });

  it('should render string error message', () => {
    const errorMessage = 'Test error message';
    render(<AuthErrorDisplay error={errorMessage} />);
    
    const element = screen.getByText(errorMessage);
    expect(element).toBeDefined();
  });

  it('should render AuthError object with message', () => {
    const error: AuthError = {
      code: 'TestError',
      message: 'Test error object message',
      name: 'TestError'
    };
    
    render(<AuthErrorDisplay error={error} />);
    
    const element = screen.getByText(error.message);
    expect(element).toBeDefined();
    
    // Should not show error details by default
    const details = screen.queryByText(/Error details/);
    expect(details).toEqual(null);
  });

  it('should render error details when showDetails is true', () => {
    const error: AuthError = {
      code: 'DetailedError',
      message: 'Error with details',
      name: 'DetailedError'
    };
    
    render(<AuthErrorDisplay error={error} showDetails={true} />);
    
    const messageElement = screen.getByText(error.message);
    expect(messageElement).toBeDefined();
    
    const detailsLabel = screen.getByText(/Error details/);
    expect(detailsLabel).toBeDefined();
    
    const errorCode = screen.getByText(/DetailedError/);
    expect(errorCode).toBeDefined();
  });

  it('should apply custom className', () => {
    const error = 'Test error';
    const customClass = 'custom-class';
    
    render(<AuthErrorDisplay error={error} className={customClass} />);
    
    const errorElement = screen.getByTestId('auth-error-display');
    expect(errorElement.className).toContain(customClass);
  });

  it('should use custom testid', () => {
    const error = 'Test error';
    const customTestId = 'custom-error-display';
    
    render(<AuthErrorDisplay error={error} testid={customTestId} />);
    
    const element = screen.getByTestId(customTestId);
    expect(element).toBeDefined();
  });
}); 