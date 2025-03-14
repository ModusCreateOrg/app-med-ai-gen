import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ShareModal from '../ShareModal';

// Mock Ionic components
vi.mock('@ionic/react', () => {
  return {
    IonModal: ({ isOpen, className, children }: { 
      isOpen: boolean, 
      onDidDismiss: () => void, 
      className: string, 
      children: React.ReactNode 
    }) => (
      isOpen ? <div data-testid="ion-modal" className={className}>{children}</div> : null
    ),
    IonHeader: ({ children }: { children: React.ReactNode }) => 
      <div data-testid="ion-header">{children}</div>,
    IonToolbar: ({ children }: { children: React.ReactNode }) => 
      <div data-testid="ion-toolbar">{children}</div>,
    IonTitle: ({ children }: { children: React.ReactNode }) => 
      <div data-testid="ion-title">{children}</div>,
    IonContent: ({ className, children }: { className: string, children: React.ReactNode }) => 
      <div data-testid="ion-content" className={className}>{children}</div>,
    IonButtons: ({ slot, children }: { slot: string, children: React.ReactNode }) => 
      <div data-testid="ion-buttons" data-slot={slot}>{children}</div>,
    IonButton: ({ onClick, slot, fill, children }: { 
      onClick?: () => void, 
      slot?: string, 
      fill?: string, 
      children: React.ReactNode 
    }) => (
      <button 
        data-testid="ion-button" 
        data-slot={slot}
        data-fill={fill}
        onClick={onClick}
      >
        {children}
      </button>
    ),
    IonItem: ({ button, detail, onClick, className, children }: { 
      button?: boolean, 
      detail?: boolean, 
      onClick?: () => void, 
      className?: string, 
      children: React.ReactNode 
    }) => (
      <div 
        data-testid="ion-item" 
        data-button={button} 
        data-detail={detail}
        className={className}
        onClick={onClick}
      >
        {children}
      </div>
    ),
    IonLabel: ({ children }: { children: React.ReactNode }) => 
      <div data-testid="ion-label">{children}</div>,
    IonInput: ({ value, readonly }: { value: string, readonly?: boolean }) => 
      <input data-testid="ion-input" value={value} readOnly={readonly} />,
    IonIcon: ({ icon, slot, className }: { icon: string, slot?: string, className?: string }) => 
      <div data-testid="ion-icon" data-icon={icon} data-slot={slot} className={className}></div>,
    IonToast: ({ isOpen, message }: { 
      isOpen: boolean, 
      onDidDismiss?: () => void, 
      message: string, 
      duration?: number, 
      position?: string 
    }) => (
      isOpen ? <div data-testid="ion-toast">{message}</div> : null
    )
  };
});

// Setup before tests run
beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
  
  // Mock clipboard API with a resolved promise
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockImplementation(() => Promise.resolve())
    },
    writable: true,
    configurable: true
  });
  
  // Mock window.open for email sharing
  window.open = vi.fn();
});

describe('ShareModal', () => {
  const testMessage = "This is a test message for sharing that will be shown in the modal";
  const mockOnClose = vi.fn();
  
  it('renders correctly when open', () => {
    render(
      <ShareModal 
        isOpen={true} 
        onClose={mockOnClose} 
        messageText={testMessage} 
      />
    );
    
    // Check modal is visible
    expect(screen.getByTestId('ion-modal')).toBeInTheDocument();
    
    // Check title
    expect(screen.getByText('Share Response')).toBeInTheDocument();
    
    // Check preview text is shown
    expect(screen.getByText(/This is a test message/)).toBeInTheDocument();
    
    // Check action items are shown
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText('Copy Full Text')).toBeInTheDocument();
    expect(screen.getByText('Share via Email')).toBeInTheDocument();
  });
  
  it('does not render when closed', () => {
    render(
      <ShareModal 
        isOpen={false} 
        onClose={mockOnClose} 
        messageText={testMessage} 
      />
    );
    
    // Modal should not be present
    expect(screen.queryByTestId('ion-modal')).not.toBeInTheDocument();
  });
  
  it('calls onClose when close button is clicked', () => {
    render(
      <ShareModal 
        isOpen={true} 
        onClose={mockOnClose} 
        messageText={testMessage} 
      />
    );
    
    // Find close button and click it
    const closeButtons = screen.getAllByTestId('ion-button');
    const closeButton = closeButtons[0]; // The first button is the close button
    fireEvent.click(closeButton);
    
    // Check onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('copies link to clipboard when Copy Link is clicked', async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');
    
    render(
      <ShareModal 
        isOpen={true} 
        onClose={mockOnClose} 
        messageText={testMessage} 
      />
    );
    
    const copyLinkItem = screen.getByText('Copy Link').closest('[data-testid="ion-item"]');
    if (!copyLinkItem) throw new Error("Copy Link element not found");
    
    fireEvent.click(copyLinkItem);
    
    // Verify clipboard was called with the link
    expect(clipboardSpy).toHaveBeenCalled();
    
    // Check toast appears
    await waitFor(() => {
      expect(screen.getByTestId('ion-toast')).toBeInTheDocument();
      expect(screen.getByText('Link copied to clipboard')).toBeInTheDocument();
    });
  });
  
  it('copies full text to clipboard when Copy Full Text is clicked', async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');
    
    render(
      <ShareModal 
        isOpen={true} 
        onClose={mockOnClose} 
        messageText={testMessage} 
      />
    );
    
    const copyTextItem = screen.getByText('Copy Full Text').closest('[data-testid="ion-item"]');
    if (!copyTextItem) throw new Error("Copy Full Text element not found");
    
    fireEvent.click(copyTextItem);
    
    // Verify clipboard was called with the full message
    expect(clipboardSpy).toHaveBeenCalledWith(testMessage);
    
    // Check toast appears
    await waitFor(() => {
      expect(screen.getByTestId('ion-toast')).toBeInTheDocument();
      expect(screen.getByText('Text copied to clipboard')).toBeInTheDocument();
    });
  });
  
  it('opens email client when Share via Email is clicked', () => {
    render(
      <ShareModal 
        isOpen={true} 
        onClose={mockOnClose} 
        messageText={testMessage} 
      />
    );
    
    const emailItem = screen.getByText('Share via Email').closest('[data-testid="ion-item"]');
    if (!emailItem) throw new Error("Share via Email element not found");
    
    fireEvent.click(emailItem);
    
    // Check window.open was called with mailto link
    expect(window.open).toHaveBeenCalled();
    // Verify it was called with a mailto URL containing the expected components
    const calls = vi.mocked(window.open).mock.calls;
    expect(calls[0][0]).toContain('mailto:');
    expect(calls[0][0]).toContain('subject=');
    expect(calls[0][0]).toContain('body=');
  });
}); 