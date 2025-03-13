import React, { useState } from 'react';
import { IonContent } from '@ionic/react';
import ChatHeader from '../ChatHeader/ChatHeader';
import ChatInput from '../ChatInput/ChatInput';
import ChatMessage from '../ChatMessage/ChatMessage';
import './AIChat.scss';

// Mock data structure for a chat message
export interface ChatMessageType {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

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
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle sending a new message
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    // Create a new user message
    const newUserMessage: ChatMessageType = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Add the user message to the chat
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    
    // Simulate AI response with loading state
    setIsLoading(true);
    
    // Mock AI response after a delay
    setTimeout(() => {
      const aiResponse: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        text: `This is a mock response to: "${text}"`,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className={`ai-chat ${isExpanded ? 'ai-chat--expanded' : ''}`}>
      <ChatHeader 
        onClose={onClose} 
        onToggleExpand={onToggleExpand} 
        isExpanded={isExpanded}
      />
      
      <IonContent className="ai-chat__content">
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
        </div>
      </IonContent>
      
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default AIChat; 