import React, { useEffect, useRef } from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import ChatMessage, { ChatMessageData } from './ChatMessage';
import './ChatContainer.scss';

interface ChatContainerProps {
  messages: ChatMessageData[];
  aiIconSrc?: string;
  robotIcon?: IconDefinition;
  testid?: string;
  className?: string;
}

/**
 * ChatContainer component that displays a list of chat messages.
 * It handles automatic scrolling and empty state display.
 */
const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  aiIconSrc,
  robotIcon,
  testid = 'chat-container',
  className = '',
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className={`chat-container ${className}`}
      ref={chatContainerRef}
      aria-live="polite"
      aria-label="Chat messages"
      data-testid={testid}
    >
      {messages.length > 0 &&
        messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            aiIconSrc={aiIconSrc}
            robotIcon={robotIcon}
            testid={`${testid}-message`}
          />
        ))}
    </div>
  );
};

export default ChatContainer;
