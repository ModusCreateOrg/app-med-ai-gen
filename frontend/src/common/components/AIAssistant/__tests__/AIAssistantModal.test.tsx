import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIAssistantModal from '../AIAssistantModal';
import WithMinimalProviders from 'test/wrappers/WithMinimalProviders';

// Define types for the mocked components
interface IonModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
  onDidDismiss?: (event: { detail: { role: string } }) => void;
}

interface IonInputProps {
  value?: string;
  onIonInput?: (event: { detail: { value: string } }) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
  placeholder?: string;
  className?: string;
  'data-testid'?: string;
}

// Mock the IonModal implementation
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react');
  return {
    ...actual,
    IonModal: ({ isOpen, children, className, 'data-testid': testId, onDidDismiss }: IonModalProps) => (
      isOpen ? (
        <div data-testid={testId} className={className}>
          <button onClick={() => onDidDismiss?.({ detail: { role: 'dismiss' } })}>
            Mock Dismiss Button
          </button>
          {children}
        </div>
      ) : null
    ),
    IonInput: ({ value, onIonInput, onKeyPress, placeholder, className, 'data-testid': testId }: IonInputProps) => (
      <input
        data-testid={testId}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onIonInput?.({ detail: { value: e.target.value } })}
        onKeyPress={onKeyPress}
      />
    )
  };
});

// Custom render that includes providers
const customRender = (ui: React.ReactElement) => {
  return render(ui, { wrapper: WithMinimalProviders });
};

describe('AIAssistantModal', () => {
  const mockSetIsOpen = vi.fn();
  const defaultProps = {
    isOpen: true,
    setIsOpen: mockSetIsOpen,
    testid: 'test-ai-assistant'
  };

  beforeEach(() => {
    mockSetIsOpen.mockClear();
  });

  it('renders the modal when isOpen is true', () => {
    customRender(<AIAssistantModal {...defaultProps} />);
    
    expect(screen.getByTestId('test-ai-assistant')).toBeDefined();
    expect(screen.getByText('AI Assistant')).toBeDefined();
  });

  it('shows empty state message when no messages exist', () => {
    customRender(<AIAssistantModal {...defaultProps} />);
    
    expect(screen.getByText('How can I help you today?')).toBeDefined();
  });

  it('allows user to type and send a message', () => {
    customRender(<AIAssistantModal {...defaultProps} />);
    
    const input = screen.getByTestId('test-ai-assistant-input');
    const sendButton = screen.getByTestId('test-ai-assistant-send-button');
    
    // Simulate input value change
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    // Check that the user message appears
    expect(screen.getByText('Test message')).toBeDefined();
  });

  it('calls setIsOpen with false when close button is clicked', () => {
    customRender(<AIAssistantModal {...defaultProps} />);
    
    const closeButton = screen.getByTestId('test-ai-assistant-close-button');
    fireEvent.click(closeButton);
    
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });
}); 