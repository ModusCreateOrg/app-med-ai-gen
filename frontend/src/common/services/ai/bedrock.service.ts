import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DirectCognitoAuthService } from '../auth/direct-cognito-auth-service';
import { REGION } from '../../config/aws-config';
import i18n from '../../utils/i18n';

// This function gets the translated message from i18n
const getContentFilteredMessage = (): string => {
  return i18n.t('ai.content_filtered', { ns: 'errors' });
};

// This function provides a healthcare-focused system prompt
const getHealthcareSystemPrompt = (): string => {
  return `You are a healthcare assistant that only responds to medical and healthcare-related questions. 
If a user asks a question that is not directly related to healthcare, medicine, medical reports, 
health conditions, treatments, or medical terminology, respond with: 
"${i18n.t('ai.non_healthcare_topic', {
    ns: 'errors',
    defaultValue:
      "I couldn't find an answer. Please try rephrasing your question or consult your healthcare provider.",
  })}"

Only provide information about healthcare topics, and always mention that users should consult healthcare professionals for personalized medical advice.`;
};

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

// Interfaces for Claude 3.7 Sonnet response
interface ClaudeContentBlock {
  type: string;
  text?: string;
  reasoningContent?: {
    reasoningText: string;
  };
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: ClaudeContentBlock[];
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Claude request body interface
interface ClaudeRequestBody {
  anthropic_version: string;
  max_tokens: number;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: { type: string; text: string }[];
  }[];
  temperature: number;
  top_p: number;
  system?: string;
}

class BedrockService {
  private client: BedrockRuntimeClient | null = null;
  private sessions: Map<string, ChatSession> = new Map();
  private isTestEnvironment: boolean;
  private contentFilteredCount: number = 0; // Track number of filtered responses

  constructor() {
    // Check if we're in a test environment (Node.js environment with no window)
    this.isTestEnvironment =
      typeof window === 'undefined' ||
      import.meta.env.MODE === 'test' ||
      import.meta.env.VITEST === 'true';

    // Only initialize the client in non-test environments or if explicitly required
    if (!this.isTestEnvironment) {
      this.initializeClient();
    }
  }

  private async initializeClient() {
    try {
      const { credentials } = await DirectCognitoAuthService.fetchAuthSession();

      // Check if credentials exist and have the necessary properties
      if (!credentials) {
        console.error('No credentials found in auth session');

        // In test environment, create a mock client instead of throwing
        if (this.isTestEnvironment) {
          return;
        }

        throw new Error('No credentials available');
      }

      const bedrockCredentials: {
        accessKeyId: string;
        secretAccessKey: string;
        expiration?: Date;
        sessionToken?: string;
      } = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      };

      if (credentials.expiration) {
        bedrockCredentials.expiration = credentials.expiration;
      }

      if (credentials.sessionToken) {
        bedrockCredentials.sessionToken = credentials.sessionToken;
      }

      this.client = new BedrockRuntimeClient({
        region: REGION,
        credentials: bedrockCredentials,
      });
    } catch (error) {
      console.error('Error initializing Bedrock client:', error);

      // Don't throw in test environment
      if (!this.isTestEnvironment) {
        throw error;
      }
    }
  }

  private handleClaudeResponse(response: ClaudeResponse): string {
    // Check if response has content
    if (!response.content || !response.content.length) {
      throw new Error('Invalid response structure: missing content');
    }

    // Check for content filtering
    if (response.stop_reason === 'content_filtered') {
      // Increment counter for analytics
      this.contentFilteredCount++;

      // Return the translated message
      return getContentFilteredMessage();
    }

    // Extract text from content blocks
    const textContent = response.content
      .filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text)
      .join('\n');

    return textContent || '';
  }

  private async invokeModel(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    // In test environment, return a mock response
    if (this.isTestEnvironment || !this.client) {
      return `This is a test response to: "${
        messages[messages.length - 1]?.content || 'No message'
      }"`;
    }

    // Format messages for Claude API
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: [{ type: 'text', text: msg.content }],
    }));

    // Prepare request body for Claude 3.7 Sonnet
    const requestBody: ClaudeRequestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: formattedMessages,
      temperature: 0.7,
      top_p: 0.9,
    };

    // Add system prompt if provided
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    // Use the cross-region inference profile ID as the model ID (following AWS docs)
    // Do not specify inferenceProfileArn separately
    const input = {
      modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    };

    try {
      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);
      const responseBody = new TextDecoder().decode(response.body);
      const parsedResponse = JSON.parse(responseBody) as ClaudeResponse;

      return this.handleClaudeResponse(parsedResponse);
    } catch (error) {
      console.error('Error invoking Claude model:', error);
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

  public async sendMessage(
    sessionId: string,
    message: string,
    systemPrompt?: string,
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Chat session not found');
    }

    // Add user message to context
    session.messages.push({
      role: 'user',
      content: message,
    });

    // Use healthcare system prompt by default, or allow custom override
    const effectiveSystemPrompt = systemPrompt || getHealthcareSystemPrompt();

    // Get response from Claude
    const response = await this.invokeModel(session.messages, effectiveSystemPrompt);

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

  public getChatSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  // Add a method to get stats
  public getContentFilteredStats(): { count: number } {
    return { count: this.contentFilteredCount };
  }
}

export const bedrockService = new BedrockService();
