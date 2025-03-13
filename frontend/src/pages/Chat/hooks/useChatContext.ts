import { useContext } from 'react';
import { ChatContext, ChatContextType } from '../context/ChatContextTypes';

/**
 * Custom hook to access the chat context
 * @returns The chat context
 * @throws Error if used outside of a ChatProvider
 */
export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}; 