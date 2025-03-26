import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Amplify } from '@aws-amplify/core';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

class BedrockService {
  private client!: BedrockRuntimeClient;
  private readonly MODEL_ID = 'amazon.titan-text-lite-v1';
  private sessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    const { credentials } = await Amplify.Auth.fetchAuthSession();
    this.client = new BedrockRuntimeClient({
      region: 'us-east-1', // Update this based on your region
      credentials: credentials,
    });
  }

  private async invokeModel(prompt: string): Promise<string> {
    const input = {
      modelId: this.MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 4096,
          stopSequences: [],
          temperature: 0.7,
          topP: 1,
        },
      }),
    };

    try {
      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);
      const responseBody = new TextDecoder().decode(response.body);
      const parsedResponse = JSON.parse(responseBody);
      return parsedResponse.results[0].outputText;
    } catch (error) {
      console.error('Error invoking Bedrock model:', error);
      throw error;
    }
  }

  public async createChatSession(): Promise<string> {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return sessionId;
  }

  public async sendMessage(sessionId: string, message: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Add user message to context
    session.messages.push({
      role: 'user',
      content: message,
    });

    // Prepare context for the model
    const context = this.prepareContext(session.messages);
    
    // Get response from Bedrock
    const response = await this.invokeModel(context);

    // Add assistant response to context
    session.messages.push({
      role: 'assistant',
      content: response,
    });

    // Update session
    session.updatedAt = new Date();
    this.sessions.set(sessionId, session);

    return response;
  }

  private prepareContext(messages: ChatMessage[]): string {
    // Format the conversation history into a prompt
    const formattedMessages = messages.map(msg => {
      const role = msg.role === 'assistant' ? 'Assistant' : 'Human';
      return `${role}: ${msg.content}`;
    });

    // Add a final prompt for the assistant
    formattedMessages.push('Assistant:');

    return formattedMessages.join('\n');
  }

  public getChatSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }
}

export const bedrockService = new BedrockService(); 