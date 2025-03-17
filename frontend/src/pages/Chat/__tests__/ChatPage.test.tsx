import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from '../ChatPage';
import WithMinimalProviders from 'test/wrappers/WithMinimalProviders';
import { chatService } from '../../../common/services/ChatService';

// Mock the chat service
vi.mock('../../../common/services/ChatService', () => ({
  chatService: {
    createUserMessage: vi.fn((text) => ({
      id: 'mock-user-message-id',
      text,
      sender: 'user',
      timestamp: new Date()
    })),
    createAssistantMessage: vi.fn((text) => ({
      id: 'mock-assistant-message-id',
      text,
      sender: 'assistant',
      timestamp: new Date()
    })),
    sendMessage: vi.fn(async (text) => `Response to: "${text}"`)
  }
}));

// Mock shared components
vi.mock('../../../common/components/Chat/ChatContainer', () => ({
  default: ({ messages, testid }: { messages: Array<{ id: string; text: string; sender: string; timestamp: Date }>; testid: string }) => (
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
  )
}));

vi.mock('../../../common/components/Chat/ChatInput', () => ({
  default: ({ onSendMessage, testid }: { onSendMessage: (text: string) => void; testid: string }) => (
    <div data-testid={testid}>
      <input 
        data-testid={`${testid}-field`}
        onChange={(_e: React.ChangeEvent<HTMLInputElement>) => {}}
      />
      <button 
        data-testid={`${testid}-send`}
        onClick={() => onSendMessage('Test message')}
      >
        Send
      </button>
    </div>
  )
}));

// Custom render that includes providers
const customRender = (ui: React.ReactElement) => {
  return render(ui, { wrapper: WithMinimalProviders });
};

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the chat page with title', () => {
    customRender(<ChatPage />);
    
    expect(screen.getByText('AI Assistant')).toBeDefined();
  });

  it('shows empty chat container initially', () => {
    customRender(<ChatPage />);
    
    expect(screen.getByTestId('chat-page-container')).toBeDefined();
    expect(screen.getByTestId('chat-page-container-empty')).toBeDefined();
  });

  it('handles sending messages', async () => {
    customRender(<ChatPage />);
    
    // Find and click the send button
    const sendButton = screen.getByTestId('chat-page-input-send');
    fireEvent.click(sendButton);
    
    // Verify that the chatService methods were called
    expect(chatService.createUserMessage).toHaveBeenCalledWith('Test message');
    expect(chatService.sendMessage).toHaveBeenCalledWith('Test message');
    
    // Wait for the response to appear
    await waitFor(() => {
      expect(chatService.createAssistantMessage).toHaveBeenCalled();
    });
  });
}); 