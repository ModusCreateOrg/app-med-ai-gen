import React, { useReducer, useEffect, ReactNode } from 'react';
import { 
  ChatMessage, 
  BedrockMessage, 
  ChatSessionStatus 
} from 'common/models/chat';
import { bedrockService } from '../services/BedrockService';
import { 
  ChatContext, 
  ChatState, 
  ChatAction,
  initialState
} from './ChatContextTypes';

// Reducer function to handle state updates
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'ADD_USER_MESSAGE': {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: action.payload,
        sender: 'user',
        timestamp: new Date()
      };
      return {
        ...state,
        messages: [...state.messages, userMessage]
      };
    }
    
    case 'ADD_AI_MESSAGE': {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: action.payload,
        sender: 'ai',
        timestamp: new Date()
      };
      return {
        ...state,
        messages: [...state.messages, aiMessage]
      };
    }
    
    case 'UPDATE_CONVERSATION_HISTORY':
      return {
        ...state,
        conversationHistory: action.payload
      };
    
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload
      };
    
    case 'CLEAR_MESSAGES':
      return {
        ...initialState
      };
    
    default:
      return state;
  }
};

// Props interface for the provider
interface ChatProviderProps {
  children: ReactNode;
}

// Provider component
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  // Load messages from local storage when component mounts
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages) as ChatMessage[];
        // Convert string timestamps back to Date objects
        parsedMessages.forEach(message => {
          message.timestamp = new Date(message.timestamp);
        });
        
        // Rebuild conversation history for the Bedrock API
        const conversationHistory: BedrockMessage[] = parsedMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
        
        // Set messages and history in state
        parsedMessages.forEach(message => {
          if (message.sender === 'user') {
            dispatch({ type: 'ADD_USER_MESSAGE', payload: message.text });
          } else {
            dispatch({ type: 'ADD_AI_MESSAGE', payload: message.text });
          }
        });
        
        dispatch({ 
          type: 'UPDATE_CONVERSATION_HISTORY', 
          payload: conversationHistory 
        });
      } catch (error) {
        console.error('Error parsing saved messages:', error);
        localStorage.removeItem('chatMessages');
      }
    }
  }, []);
  
  // Save messages to local storage when they change
  useEffect(() => {
    if (state.messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(state.messages));
    }
  }, [state.messages]);
  
  // Function to send a message and get a response
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message to state
    dispatch({ type: 'ADD_USER_MESSAGE', payload: text });
    
    // Update conversation history
    const userMessage: BedrockMessage = {
      role: 'user',
      content: text
    };
    
    const updatedHistory = [...state.conversationHistory, userMessage];
    dispatch({ 
      type: 'UPDATE_CONVERSATION_HISTORY', 
      payload: updatedHistory 
    });
    
    // Set loading state and show typing indicator
    dispatch({ type: 'SET_STATUS', payload: ChatSessionStatus.LOADING });
    dispatch({ type: 'SET_TYPING', payload: true });
    
    try {
      // Send request to Bedrock service
      const response = await bedrockService.createChatCompletion({
        messages: updatedHistory,
        temperature: 0.7,
        maxTokens: 500
      });
      
      // Short delay to make typing indicator visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Hide typing indicator
      dispatch({ type: 'SET_TYPING', payload: false });
      
      // Update conversation history with AI response
      const updatedHistoryWithResponse = [
        ...updatedHistory,
        response.message
      ];
      
      dispatch({ 
        type: 'UPDATE_CONVERSATION_HISTORY', 
        payload: updatedHistoryWithResponse 
      });
      
      // Add AI response to messages
      dispatch({ 
        type: 'ADD_AI_MESSAGE', 
        payload: response.message.content 
      });
      
      // Set status back to idle
      dispatch({ type: 'SET_STATUS', payload: ChatSessionStatus.IDLE });
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Hide typing indicator
      dispatch({ type: 'SET_TYPING', payload: false });
      
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'An error occurred while fetching the response' 
      });
      
      // Add error message as AI response
      dispatch({
        type: 'ADD_AI_MESSAGE',
        payload: "I'm sorry, I encountered an error processing your request. Please try again later."
      });
      
      // Set status to error
      dispatch({ type: 'SET_STATUS', payload: ChatSessionStatus.ERROR });
    }
  };
  
  // Function to clear all messages
  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    localStorage.removeItem('chatMessages');
  };
  
  return (
    <ChatContext.Provider value={{ state, sendMessage, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
}; 