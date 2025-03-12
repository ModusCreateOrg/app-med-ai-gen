import { render, screen } from '@testing-library/react';
import { vi, expect } from 'vitest';
import AuthLoadingIndicator from '../AuthLoadingIndicator';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key // Return the key as the translation for testing
  })
}));

describe('AuthLoadingIndicator', () => {
  it('should not render when loading is false', () => {
    const { container } = render(<AuthLoadingIndicator isLoading={false} />);
    expect(container.firstChild).toEqual(null);
  });

  it('should render spinner and default message when loading is true', () => {
    render(<AuthLoadingIndicator isLoading={true} />);
    
    // Check that the component is rendered with the correct testid
    const loadingElement = screen.getByTestId('auth-loading');
    expect(loadingElement).toBeDefined();
    
    // Check that the spinner is rendered - using element type instead of role
    const spinner = loadingElement.querySelector('ion-spinner');
    expect(spinner).toBeDefined();
    
    // Check that the default message is displayed
    const message = screen.getByText('loading');
    expect(message).toBeDefined();
  });

  it('should render with custom message', () => {
    const customMessage = 'Custom loading message';
    render(<AuthLoadingIndicator isLoading={true} message={customMessage} />);
    
    const message = screen.getByText(customMessage);
    expect(message).toBeDefined();
  });

  it('should apply custom className', () => {
    const customClass = 'custom-class';
    render(<AuthLoadingIndicator isLoading={true} className={customClass} />);
    
    const loadingElement = screen.getByTestId('auth-loading');
    expect(loadingElement.className).toContain(customClass);
  });

  it('should use custom testid', () => {
    const customTestId = 'custom-loading-indicator';
    render(<AuthLoadingIndicator isLoading={true} testid={customTestId} />);
    
    const element = screen.getByTestId(customTestId);
    expect(element).toBeDefined();
  });
}); 