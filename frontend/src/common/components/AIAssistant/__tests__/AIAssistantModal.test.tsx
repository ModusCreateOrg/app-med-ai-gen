import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIAssistantModal from '../AIAssistantModal';
import WithTestProviders from 'test/wrappers/WithTestProviders';

// Define types for the mocked components
interface IonModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
  onDidDismiss?: (event: { detail: { role: string } }) => void;
}

// Mock the chat service
vi.mock('../../../services/ChatService', () => {
  return {
    chatService: {
      createUserMessage: vi.fn((text) => ({
        id: 'mock-user-message-id',
        text,
        sender: 'user',
        timestamp: new Date(),
      })),
      createAssistantMessage: vi.fn((text) => ({
        id: 'mock-assistant-message-id',
        text,
        sender: 'assistant',
        timestamp: new Date(),
      })),
      sendMessage: vi.fn(async () => 'Mock response'),
      resetSession: vi.fn(async () => Promise.resolve()),
    },
  };
});

// Mock icons
vi.mock('ionicons/icons', () => ({
  closeOutline: 'mock-close-icon',
  expandOutline: 'mock-expand-icon',
  contractOutline: 'mock-contract-icon',
  paperPlaneOutline: 'mock-paper-plane-icon',
  personCircleOutline: 'mock-person-circle-icon',
}));

// Mock shared components
vi.mock('../../../components/Chat/ChatContainer', () => ({
  default: ({
    messages,
    testid,
  }: {
    messages: Array<{ id: string; text: string; sender: string; timestamp: Date }>;
    testid: string;
  }) => (
    <div data-testid={testid}>
      {messages.length === 0 ? (
        <div data-testid={`${testid}-empty`}>Empty State</div>
      ) : (
        messages.map((message) => (
          <div key={message.id} data-testid={`${testid}-message-${message.sender}`}>
            {message.text}
          </div>
        ))
      )}
    </div>
  ),
}));

vi.mock('../../../components/Chat/ChatInput', () => ({
  default: ({
    onSendMessage,
    testid,
  }: {
    onSendMessage: (text: string) => void;
    testid: string;
  }) => (
    <div data-testid={testid}>
      <input
        data-testid={`${testid}-field`}
        onChange={(_e: React.ChangeEvent<HTMLInputElement>) => {}}
      />
      <button data-testid={`${testid}-send`} onClick={() => onSendMessage('Test message')}>
        Send
      </button>
    </div>
  ),
}));

// Mock the IonModal implementation
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react');

  // Create mock implementations for Ionic components
  const mockIonApp = ({ children }: { children: React.ReactNode }) => (
    <div className="mock-ion-app">{children}</div>
  );

  return {
    ...actual,
    IonApp: mockIonApp,
    IonModal: ({
      isOpen,
      children,
      className,
      'data-testid': testId,
      onDidDismiss,
    }: IonModalProps) =>
      isOpen ? (
        <div data-testid={testId} className={className}>
          <button onClick={() => onDidDismiss?.({ detail: { role: 'dismiss' } })}>
            Mock Dismiss Button
          </button>
          {children}
        </div>
      ) : null,
    IonIcon: ({ icon, 'aria-hidden': ariaHidden }: { icon: string; 'aria-hidden'?: boolean }) => (
      <span data-testid={`icon-${icon}`} aria-hidden={ariaHidden}>
        {icon}
      </span>
    ),
    // Mock other Ionic components used in the component
    IonHeader: ({ children }: { children: React.ReactNode }) => (
      <div className="ion-header">{children}</div>
    ),
    IonToolbar: ({ children }: { children: React.ReactNode }) => (
      <div className="ion-toolbar">{children}</div>
    ),
    IonButtons: ({ children }: { children: React.ReactNode }) => (
      <div className="ion-buttons">{children}</div>
    ),
    IonButton: ({
      onClick,
      children,
      'data-testid': testId,
    }: {
      onClick?: () => void;
      children: React.ReactNode;
      'data-testid'?: string;
    }) => (
      <button onClick={onClick} data-testid={testId}>
        {children}
      </button>
    ),
    IonTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={`ion-title ${className || ''}`}>{children}</div>
    ),
    IonContent: ({ children }: { children: React.ReactNode }) => (
      <div className="ion-content">{children}</div>
    ),
    IonFooter: ({ children }: { children: React.ReactNode }) => (
      <div className="ion-footer">{children}</div>
    ),
    isPlatform: () => false,
    getPlatforms: () => [],
    getConfig: () => ({}),
  };
});

// Import the mock directly to use in tests
import { chatService as mockChatService } from '../../../services/ChatService';

// Custom render that includes providers
const customRender = (ui: React.ReactElement) => {
  return render(ui, { wrapper: WithTestProviders });
};

describe('AIAssistantModal', () => {
  const mockSetIsOpen = vi.fn();
  const defaultProps = {
    isOpen: true,
    setIsOpen: mockSetIsOpen,
    testid: 'test-ai-assistant',
  };

  beforeEach(() => {
    mockSetIsOpen.mockClear();
    vi.clearAllMocks();
  });

  it('renders the modal when isOpen is true', () => {
    customRender(<AIAssistantModal {...defaultProps} />);

    expect(screen.getByTestId('test-ai-assistant')).toBeDefined();
    expect(screen.getByText('AI Assistant')).toBeDefined();
  });

  it('shows empty chat container initially', () => {
    customRender(<AIAssistantModal {...defaultProps} />);

    expect(screen.getByTestId('test-ai-assistant-chat-container')).toBeDefined();
    expect(screen.getByTestId('test-ai-assistant-chat-container-empty')).toBeDefined();
  });

  it('calls setIsOpen with false when close button is clicked', () => {
    customRender(<AIAssistantModal {...defaultProps} />);

    const closeButton = screen.getByTestId('test-ai-assistant-close-button');
    fireEvent.click(closeButton);

    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  it('toggles between expanded and collapsed state when expand button is clicked', () => {
    customRender(<AIAssistantModal {...defaultProps} />);

    // Initially should show expand icon
    expect(screen.getByTestId('icon-mock-expand-icon')).toBeDefined();

    // Click expand button
    const expandButton = screen.getByTestId('test-ai-assistant-expand-button');
    fireEvent.click(expandButton);

    // Now should show contract icon
    expect(screen.getByTestId('icon-mock-contract-icon')).toBeDefined();

    // Click again to collapse
    fireEvent.click(expandButton);

    // Should show expand icon again
    expect(screen.getByTestId('icon-mock-expand-icon')).toBeDefined();
  });

  it.skip('automatically expands when the first message is sent', async () => {
    customRender(<AIAssistantModal {...defaultProps} />);

    // Initially should show expand icon (not expanded)
    expect(screen.getByTestId('icon-mock-expand-icon')).toBeDefined();

    // Find and click the send button
    const sendButton = screen.getByTestId('test-ai-assistant-input-send');
    fireEvent.click(sendButton);

    // After sending the first message, it should automatically expand
    // and show the contract icon
    await waitFor(() => {
      expect(screen.getByTestId('icon-mock-contract-icon')).toBeDefined();
    });
  });

  it.skip('handles sending messages', async () => {
    customRender(<AIAssistantModal {...defaultProps} />);

    // Find and click the send button
    const sendButton = screen.getByTestId('test-ai-assistant-input-send');
    fireEvent.click(sendButton);

    // Verify that the chatService methods were called
    await waitFor(() => {
      expect(mockChatService.createUserMessage).toHaveBeenCalledWith('Test message');
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('Test message');
      expect(mockChatService.createAssistantMessage).toHaveBeenCalled();
    });
  });
});
