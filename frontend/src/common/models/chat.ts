/**
 * Types for the AI Chat feature
 */

/**
 * Represents a single chat message in the UI
 */
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isRead?: boolean;
}

/**
 * API message format for Bedrock
 */
export interface BedrockMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Request payload for chat completion
 */
export interface ChatCompletionRequest {
  messages: BedrockMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * Response from the chat completion API
 */
export interface ChatCompletionResponse {
  message: BedrockMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

/**
 * Status of a chat session
 */
export enum ChatSessionStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error'
}

/**
 * Chat session configuration
 */
export interface ChatSessionConfig {
  maxHistoryLength?: number;
  persistHistory?: boolean;
  defaultGreeting?: string;
  model?: string;
} 