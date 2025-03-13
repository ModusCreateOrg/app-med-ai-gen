import React from 'react';
import { format } from 'date-fns';
import { ChatMessageType } from '../AIChat/AIChat';
import './ChatMessage.scss';

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * ChatMessage component displays an individual message in the chat
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { text, sender, timestamp } = message;
  const isAI = sender === 'ai';
  const formattedTime = format(timestamp, 'h:mm a');
  
  return (
    <div className={`chat-message ${isAI ? 'chat-message--ai' : 'chat-message--user'}`}>
      <div className="chat-message__content">
        {isAI && (
          <div className="chat-message__avatar">
            <div className="chat-message__avatar-icon">AI</div>
          </div>
        )}
        
        <div className="chat-message__bubble">
          <div className="chat-message__text">{text}</div>
          <div className="chat-message__time">{formattedTime}</div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 