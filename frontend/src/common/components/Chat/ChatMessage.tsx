import { IonIcon } from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import './ChatMessage.scss';

export interface ChatMessageData {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatMessageProps {
  message: ChatMessageData;
  aiIconSrc?: string;
  robotIcon?: IconDefinition;
  testid?: string;
}

/**
 * ChatMessage component displays a single message in the chat UI.
 * It can be used for both user and AI assistant messages.
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  aiIconSrc,
  robotIcon,
  testid = 'chat-message' 
}) => {
  const isUser = message.sender === 'user';
  const messageTestId = `${testid}-${message.id}`;

  return (
    <div 
      className={`chat-message ${isUser ? 'user-message' : 'assistant-message'}`}
      aria-label={`${isUser ? 'You' : 'AI Assistant'}: ${message.text}`}
      data-testid={messageTestId}
    >
      {isUser && (
        <div className="message-avatar user-avatar" data-testid={`${messageTestId}-avatar`}>
          <IonIcon icon={personCircleOutline} aria-hidden="true" />
        </div>
      )}
      
      {!isUser && (
        <div className="message-avatar assistant-avatar" data-testid={`${messageTestId}-avatar`}>
          {robotIcon ? (
            <FontAwesomeIcon icon={robotIcon} aria-hidden="true" />
          ) : aiIconSrc ? (
            <img src={aiIconSrc} alt="AI" aria-hidden="true" />
          ) : (
            <IonIcon icon={personCircleOutline} aria-hidden="true" />
          )}
        </div>
      )}
      
      <div className="message-content">
        <p data-testid={`${messageTestId}-text`}>{message.text}</p>
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

export default ChatMessage; 