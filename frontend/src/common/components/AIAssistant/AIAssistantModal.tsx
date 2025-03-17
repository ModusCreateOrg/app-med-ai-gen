import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonTitle,
  IonToolbar,
  IonFooter,
} from '@ionic/react';
import { useState, useRef, useEffect } from 'react';
import { closeOutline, expandOutline, contractOutline, paperPlaneOutline, personCircleOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import iconOnly from '../../../assets/img/icon-only.png';
import './AIAssistantModal.scss';

interface AIAssistantModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  testid?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ 
  isOpen, 
  setIsOpen,
  testid = 'ai-assistant-modal'
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const modalRef = useRef<HTMLIonModalElement>(null);
  const inputRef = useRef<HTMLIonInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle chat scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus on input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.setFocus();
      }, 300); // Delay to allow the modal to fully open
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    
    // Ensure scroll position is maintained after expanding/collapsing
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const newUserMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setMessages([...messages, newUserMessage]);
    setInputValue('');

    // Focus on input after sending message
    setTimeout(() => {
      inputRef.current?.setFocus();
    }, 50);

    // Mock AI response (would be replaced with actual API call)
    setTimeout(() => {
      const newAIMessage = {
        id: (Date.now() + 1).toString(),
        text: `This is a placeholder response to: "${inputValue}"`,
        sender: 'assistant' as const,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, newAIMessage]);
    }, 1000);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleInputChange = (e: CustomEvent) => {
    setInputValue(e.detail.value || '');
  };

  const renderMessageWithAvatar = (message: ChatMessage) => {
    const isUser = message.sender === 'user';

    return (
      <div 
        key={message.id} 
        className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}
        aria-label={`${isUser ? 'You' : 'AI Assistant'}: ${message.text}`}
      >
        {isUser && (
          <div className="message-avatar user-avatar">
            <IonIcon icon={personCircleOutline} aria-hidden="true" />
          </div>
        )}
        
        {!isUser && (
          <div className="message-avatar assistant-avatar">
            <img src={iconOnly} alt="AI" aria-hidden="true" />
          </div>
        )}
        
        <div className="message-content">
          <p>{message.text}</p>
        </div>
        <span className="sr-only">
          {new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric'
          }).format(message.timestamp)}
        </span>
      </div>
    );
  };

  return (
    <IonModal 
      isOpen={isOpen}
      onDidDismiss={() => setIsOpen(false)}
      ref={modalRef}
      className={`ai-assistant-modal ${isExpanded ? 'expanded' : ''}`}
      data-testid={testid}
      aria-labelledby="ai-assistant-title"
    >
      <IonHeader className="ai-assistant-header">
        <IonToolbar>
          <IonTitle id="ai-assistant-title">
            <img src={iconOnly} alt="AI Assistant Icon" className="ai-assistant-title-icon" />
            AI Assistant
          </IonTitle>
          <IonButtons slot="end">
            <IonButton 
              onClick={handleExpand}
              aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
              data-testid={`${testid}-expand-button`}
            >
              <IonIcon icon={isExpanded ? contractOutline : expandOutline} aria-hidden="true" />
            </IonButton>
            <IonButton 
              onClick={handleClose}
              aria-label="Close AI Assistant"
              data-testid={`${testid}-close-button`}
            >
              <IonIcon icon={closeOutline} aria-hidden="true" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ai-assistant-content">
        <div 
          className="chat-container" 
          ref={chatContainerRef}
          aria-live="polite"
          aria-label="Chat messages"
          data-testid={`${testid}-chat-container`}
        >
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <p>{t('common.aiAssistant.emptyState', 'How can I help you today?')}</p>
            </div>
          ) : (
            messages.map(renderMessageWithAvatar)
          )}
        </div>
      </IonContent>

      <IonFooter className="ai-assistant-footer">
        <div className="input-container">
          <IonInput
            placeholder={t('common.aiAssistant.inputPlaceholder', 'Type your question...')}
            value={inputValue}
            onIonInput={handleInputChange}
            onKeyPress={handleKeyPress}
            ref={inputRef}
            className="message-input"
            clearInput
            aria-label="Type your message"
            data-testid={`${testid}-input`}
          />
          <IonButton 
            fill="clear" 
            onClick={handleSendMessage}
            disabled={inputValue.trim() === ''}
            className="send-button"
            aria-label="Send message"
            data-testid={`${testid}-send-button`}
          >
            <IonIcon icon={paperPlaneOutline} aria-hidden="true" />
          </IonButton>
        </div>
      </IonFooter>
    </IonModal>
  );
};

export default AIAssistantModal; 