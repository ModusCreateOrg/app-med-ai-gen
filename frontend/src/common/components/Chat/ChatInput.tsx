import { IonFab, IonFabButton, IonIcon, IonInput } from '@ionic/react';
import { paperPlaneOutline } from 'ionicons/icons';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ChatInput.scss';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  testid?: string;
  className?: string;
  placeholder?: string;
}

/**
 * ChatInput component for entering and sending chat messages.
 * Can be used in both modal and page contexts.
 */
const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  testid = 'chat-input',
  className = '',
  placeholder,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLIonInputElement>(null);
  
  const defaultPlaceholder = t('common.aiAssistant.inputPlaceholder', 'Type your question...');
  const inputPlaceholder = placeholder || defaultPlaceholder;

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
    onSendMessage(inputValue);
    setInputValue('');
    
    // Focus input after sending
    setTimeout(() => {
      inputRef.current?.setFocus();
    }, 50);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleInputChange = (e: CustomEvent) => {
    setInputValue(e.detail.value || '');
  };

  return (
    <div className={`chat-input-container ${className}`}>
      <div className="input-wrapper">
        <IonInput
          placeholder={inputPlaceholder}
          value={inputValue}
          onIonInput={handleInputChange}
          onKeyPress={handleKeyPress}
          ref={inputRef}
          className="message-input"
          clearInput
          aria-label="Type your message"
          data-testid={`${testid}-field`}
        />
        <IonFab className="send-fab" vertical="center" horizontal="end" slot="fixed">
          <IonFabButton 
            size="small"
            onClick={handleSendMessage}
            disabled={inputValue.trim() === ''}
            className="send-button"
            aria-label="Send message"
            data-testid={`${testid}-send`}
          >
            <IonIcon icon={paperPlaneOutline} aria-hidden="true" />
          </IonFabButton>
        </IonFab>
      </div>
    </div>
  );
};

export default ChatInput; 