import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { send } from 'ionicons/icons';
import './ChatInput.scss';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

/**
 * ChatInput component provides an input field and send button for user messages
 */
const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage,
  disabled = false 
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input">
      <textarea
        ref={textareaRef}
        className="chat-input__field"
        placeholder="Type your question..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        maxLength={1000}
      />
      <button 
        className={`chat-input__button ${disabled || !inputValue.trim() ? 'chat-input__button--disabled' : ''}`}
        onClick={handleSend}
        disabled={disabled || !inputValue.trim()}
        aria-label="Send message"
      >
        <IonIcon icon={send} className="chat-input__send-icon" />
      </button>
    </div>
  );
};

export default ChatInput; 