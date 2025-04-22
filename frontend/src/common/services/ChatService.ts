import { ChatMessageData } from '../components/Chat/ChatMessage';
import { bedrockService } from './ai/bedrock.service';

/**
 * Service for managing chat functionality including sending messages and getting responses.
 */
class ChatService {
  private currentSessionId?: string;

  constructor() {
    this.initializeSession();
  }

  private async initializeSession() {
    this.currentSessionId = await bedrockService.createChatSession();
  }

  /**
   * Send a message to the AI assistant and get a response
   * @param message The message text to send
   * @returns A promise that resolves to the AI's response
   */
  async sendMessage(message: string): Promise<string> {
    if (!this.currentSessionId) {
      await this.initializeSession();
    }

    return bedrockService.sendMessage(this.currentSessionId!, message);
  }

  /**
   * Reset the current chat session
   * This creates a new Bedrock session and discards the old one
   */
  async resetSession(): Promise<void> {
    this.currentSessionId = await bedrockService.createChatSession();
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
      timestamp: new Date(),
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
      timestamp: new Date(),
    };
  }
}

// Export a singleton instance
export const chatService = new ChatService();
