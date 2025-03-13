import React, { useState } from 'react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { ChatMessage as ChatMessageType } from 'common/models/chat';
import MessageActions from './MessageActions';
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
  const [showTime, setShowTime] = useState(false);
  
  const toggleTime = () => {
    setShowTime(!showTime);
  };
  
  return (
    <div 
      className={`chat-message ${isAI ? 'chat-message--ai' : 'chat-message--user'}`}
      onClick={toggleTime}
    >
      <div className="chat-message__content">
        {isAI && (
          <div className="chat-message__avatar">
            <div className="chat-message__avatar-icon">AI</div>
          </div>
        )}
        
        <div className="chat-message__bubble">
          <div className="chat-message__text">
            {isAI ? (
              <ReactMarkdown 
                rehypePlugins={[rehypeSanitize]}
                components={{
                  // Remove p tags that mess with our styling
                  p: ({...props}) => <span {...props} />
                }}
              >
                {text}
              </ReactMarkdown>
            ) : (
              text
            )}
          </div>
          <div className={`chat-message__time ${showTime ? 'chat-message__time--visible' : ''}`}>
            {formattedTime}
          </div>
          
          {isAI && <MessageActions text={text} />}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 