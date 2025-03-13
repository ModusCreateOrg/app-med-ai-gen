import { createContext } from 'react';
import { 
  ChatMessage, 
  BedrockMessage, 
  ChatSessionStatus 
} from 'common/models/chat';

// Define the chat state interface
export interface ChatState {
  messages: ChatMessage[];
  conversationHistory: BedrockMessage[];
  status: ChatSessionStatus;
  error: string | null;
}

// Define the actions that can be performed on the chat state
export type ChatAction = 
  | { type: 'ADD_USER_MESSAGE'; payload: string }
  | { type: 'ADD_AI_MESSAGE'; payload: string }
  | { type: 'UPDATE_CONVERSATION_HISTORY'; payload: BedrockMessage[] }
  | { type: 'SET_STATUS'; payload: ChatSessionStatus }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' };

// Define the context interface
export interface ChatContextType {
  state: ChatState;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

// Initial state for the reducer
export const initialState: ChatState = {
  messages: [],
  conversationHistory: [],
  status: ChatSessionStatus.IDLE,
  error: null
};

// Create the context with a default value
export const ChatContext = createContext<ChatContextType | undefined>(undefined); 