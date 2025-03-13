import React, { useRef, useEffect } from 'react';
import { IonContent } from '@ionic/react';
import ChatHeader from '../ChatHeader/ChatHeader';
import ChatInput from '../ChatInput/ChatInput';
import ChatMessage from '../ChatMessage/ChatMessage';
import { useChatContext } from '../../hooks/useChatContext';
import { ChatSessionStatus } from 'common/models/chat';
import './AIChat.scss';

interface AIChatProps {
  isExpanded: boolean;
  onClose: () => void;
  onToggleExpand: () => void;
}

/**
 * AIChat component serves as the container for the AI chat functionality
 */
const AIChat: React.FC<AIChatProps> = ({ 
  isExpanded, 
  onClose, 
  onToggleExpand 
}) => {
  const { state, sendMessage } = useChatContext();
  const { messages, status, error } = state;
  const contentRef = useRef<HTMLIonContentElement>(null);
  const isLoading = status === ChatSessionStatus.LOADING;
  
  // Function to handle sending a new message
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    await sendMessage(text);
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollToBottom(300);
    }
  }, [messages]);

  return (
    <div className={`ai-chat ${isExpanded ? 'ai-chat--expanded' : ''}`}>
      <ChatHeader 
        onClose={onClose} 
        onToggleExpand={onToggleExpand} 
        isExpanded={isExpanded}
      />
      
      <IonContent className="ai-chat__content" ref={contentRef}>
        <div className="ai-chat__messages">
          {messages.length === 0 ? (
            <div className="ai-chat__empty-state">
              <p>Ask me anything about your medical reports or health questions.</p>
            </div>
          ) : (
            messages.map(message => (
              <ChatMessage 
                key={message.id} 
                message={message} 
              />
            ))
          )}
          
          {isLoading && (
            <div className="ai-chat__loading">
              <div className="ai-chat__loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          {error && status === ChatSessionStatus.ERROR && (
            <div className="ai-chat__error">
              <p>{error}</p>
            </div>
          )}
        </div>
      </IonContent>
      
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default AIChat; 