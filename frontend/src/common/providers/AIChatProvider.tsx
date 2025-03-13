import React, { createContext, useState, useContext, ReactNode } from 'react';
import AIChatContainer from 'pages/Chat/components/AIChatContainer/AIChatContainer';

// Context to manage the visibility of the AI Chat globally
interface AIChatContextType {
  openChat: () => void;
  closeChat: () => void;
  isVisible: boolean;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

// Custom hook for components to access the AI Chat context
export const useAIChat = () => {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
};

interface AIChatProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes AI Chat available throughout the app
 */
export const AIChatProvider: React.FC<AIChatProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);

  const openChat = () => {
    setIsVisible(true);
  };

  const closeChat = () => {
    setIsVisible(false);
  };

  return (
    <AIChatContext.Provider value={{ openChat, closeChat, isVisible }}>
      {children}
      <AIChatContainer 
        isVisible={isVisible} 
        onClose={closeChat} 
      />
    </AIChatContext.Provider>
  );
}; 