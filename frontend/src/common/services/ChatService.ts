import { ChatMessageData } from '../components/Chat/ChatMessage';

/**
 * Service for managing chat functionality including sending messages and getting responses.
 */
class ChatService {
  /**
   * Send a message to the AI assistant and get a response
   * @param message The message text to send
   * @returns A promise that resolves to the AI's response
   */
  async sendMessage(message: string): Promise<string> {
    // This is a mock implementation
    // In a real app, this would call an API endpoint
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a mock response based on the input
    const responses: Record<string, string> = {
      'hello': 'Hello! How can I help you today?',
      'hi': 'Hi there! What can I assist you with?',
      'how are you': 'I\'m just a digital assistant, but thanks for asking! How can I help you?',
      'who are you': 'I\'m an AI assistant designed to help answer your questions and provide information.',
      'what can you do': 'I can answer questions, provide information, and help you with various tasks. What do you need help with?',
    };
    
    // Check for exact matches
    const lowerMessage = message.toLowerCase();
    if (responses[lowerMessage]) {
      return responses[lowerMessage];
    }
    
    // Check for partial matches
    for (const key of Object.keys(responses)) {
      if (lowerMessage.includes(key)) {
        return responses[key];
      }
    }
    
    // Default response
    return `This is a placeholder response to: "${message}"`;
  }
  
  /**
   * Create a user message object
   * @param text The message text
   * @returns A ChatMessageData object
   */
  createUserMessage(text: string): ChatMessageData {
    return {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
  }
  
  /**
   * Create an assistant message object
   * @param text The message text
   * @returns A ChatMessageData object
   */
  createAssistantMessage(text: string): ChatMessageData {
    return {
      id: (Date.now() + 1).toString(),
      text,
      sender: 'assistant',
      timestamp: new Date()
    };
  }
}

// Export a singleton instance
export const chatService = new ChatService(); 