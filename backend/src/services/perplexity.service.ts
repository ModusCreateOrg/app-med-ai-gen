import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AwsSecretsService } from './aws-secrets.service';

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stream?: boolean;
}

export interface PerplexityResponse {
  id: string;
  choices: {
    index: number;
    message: PerplexityMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Service for interacting with the Perplexity API
 */
@Injectable()
export class PerplexityService {
  private readonly logger = new Logger(PerplexityService.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly defaultMaxTokens: number;
  private apiKey: string | null = null;
  private readonly isTestEnv: boolean;

  constructor(
    private configService: ConfigService,
    private secretsService: AwsSecretsService,
  ) {
    this.isTestEnv = process.env.NODE_ENV === 'test';

    // In test environment, use default values
    if (this.isTestEnv) {
      this.baseUrl = 'https://api.perplexity.ai';
      this.defaultModel = 'test-model';
      this.defaultMaxTokens = 1000;
    } else {
      this.baseUrl =
        this.configService.get<string>('perplexity.apiBaseUrl') || 'https://api.perplexity.ai';
      this.defaultModel = this.configService.get<string>('perplexity.model') || 'sonar';
      this.defaultMaxTokens = this.configService.get<number>('perplexity.maxTokens') || 2048;
    }
  }

  /**
   * Gets the API key from AWS Secrets Manager
   * @returns The API key
   */
  private async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    if (this.isTestEnv) {
      this.apiKey = 'test-api-key';
      return this.apiKey;
    }

    const secretName =
      this.configService.get<string>('aws.secretsManager.perplexityApiKeySecret') ||
      'medical-reports-explainer/perplexity-api-key';

    if (!secretName) {
      throw new Error('Perplexity API key secret name is not configured');
    }

    try {
      this.apiKey = await this.secretsService.getSecret(secretName);
      return this.apiKey;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get API key: ${errorMessage}`);
      throw new Error('Failed to retrieve Perplexity API key');
    }
  }

  /**
   * Sends a chat completion request to the Perplexity API
   *
   * @param messages Array of messages for the conversation
   * @param options Additional options for the request
   * @returns The chat completion response
   */
  async createChatCompletion(
    messages: PerplexityMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    },
  ): Promise<PerplexityResponse> {
    try {
      const apiKey = await this.getApiKey();

      const request: PerplexityRequest = {
        model: options?.model || this.defaultModel,
        messages,
        max_tokens: options?.maxTokens || this.defaultMaxTokens,
        temperature: options?.temperature || 0.7,
      };

      const response = await axios.post<PerplexityResponse>(
        `${this.baseUrl}/chat/completions`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Perplexity API error: ${error.response?.status} - ${error.message}`);
        throw new Error(`Perplexity API error: ${error.message}`);
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create chat completion: ${errorMessage}`);
      throw new Error('Failed to create chat completion');
    }
  }

  /**
   * Generates a simplified explanation of medical text
   *
   * @param medicalText The medical text to explain
   * @returns The simplified explanation
   */
  async explainMedicalText(medicalText: string): Promise<string> {
    const systemPrompt =
      'You are an AI assistant that specializes in explaining complex medical information in simple terms.\n' +
      'Your goal is to help patients understand their medical reports by translating medical jargon into plain language.\n' +
      'You must be accurate, concise, comprehensive, and easy to understand. Use everyday analogies when helpful.\n';

    const userPrompt = `Please explain the following medical text in simple terms, in a single paragraph that's between 10 to 200 words, all in normal text NOT .md style, the more concise the better:\n\n${medicalText}`;

    const messages: PerplexityMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.createChatCompletion(messages);
    return response.choices[0].message.content.trim();
  }
}
