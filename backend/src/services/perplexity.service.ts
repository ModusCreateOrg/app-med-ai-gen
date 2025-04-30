import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AwsSecretsService } from './aws-secrets.service';
import { LabValue } from 'src/document-processor/services/aws-bedrock.service';

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityToolFunction {
  name: string;
  description?: string;
  parameters: Record<string, any>;
}

export interface PerplexityTool {
  type: 'function';
  function: PerplexityToolFunction;
}

export interface PerplexityResponseFormat {
  type: 'text' | 'json_object';
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
  tools?: PerplexityTool[];
  response_format?: PerplexityResponseFormat;
}

export interface PerplexityToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
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
  tool_calls?: PerplexityToolCall[];
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

    const secretName = this.configService.get<string>('aws.secretsManager.perplexityApiKeySecret');

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
   * Queries the Perplexity AI API
   */
  async createChatCompletion(
    messages: PerplexityMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      presencePenalty?: number;
      frequencyPenalty?: number;
      tools?: PerplexityTool[];
      responseFormat?: PerplexityResponseFormat;
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

      // Add optional parameters if provided
      if (options?.topP !== undefined) request.top_p = options.topP;
      if (options?.topK !== undefined) request.top_k = options.topK;
      if (options?.presencePenalty !== undefined)
        request.presence_penalty = options.presencePenalty;
      if (options?.frequencyPenalty !== undefined)
        request.frequency_penalty = options.frequencyPenalty;
      if (options?.tools) request.tools = options.tools;
      if (options?.responseFormat) request.response_format = options.responseFormat;

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
   * Queries the Perplexity AI API with streaming responses
   * @returns A readable stream of the response
   */
  async createStreamingChatCompletion(
    messages: PerplexityMessage[],
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      presencePenalty?: number;
      frequencyPenalty?: number;
      tools?: PerplexityTool[];
      responseFormat?: PerplexityResponseFormat;
    },
  ): Promise<ReadableStream> {
    try {
      const apiKey = await this.getApiKey();

      const request: PerplexityRequest = {
        model: options?.model || this.defaultModel,
        messages,
        max_tokens: options?.maxTokens || this.defaultMaxTokens,
        temperature: options?.temperature || 0.7,
        stream: true,
      };

      // Add optional parameters if provided
      if (options?.topP !== undefined) request.top_p = options.topP;
      if (options?.topK !== undefined) request.top_k = options.topK;
      if (options?.presencePenalty !== undefined)
        request.presence_penalty = options.presencePenalty;
      if (options?.frequencyPenalty !== undefined)
        request.frequency_penalty = options.frequencyPenalty;
      if (options?.tools) request.tools = options.tools;
      if (options?.responseFormat) request.response_format = options.responseFormat;

      const response = await axios.post(`${this.baseUrl}/chat/completions`, request, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        responseType: 'stream',
      });

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Perplexity API streaming error: ${error.response?.status} - ${error.message}`,
        );
        throw new Error(`Perplexity API streaming error: ${error.message}`);
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create streaming chat completion: ${errorMessage}`);
      throw new Error('Failed to create streaming chat completion');
    }
  }

  /**
   * Reviews and verifies a medical document lab values against trusted medical sources
   *
   * @param labValues The medical document lab values to review
   * @param originalText The original text of the medical document
   * @returns The corrected medical document lab values
   */
  async reviewLabValuesAnalysis(labValues: LabValue[], originalText: string): Promise<LabValue[]> {
    this.logger.log('Reviewing medical document lab values with Perplexity');

    const systemPrompt =
      'Medical information verification specialist. Verify lab values against trusted sources (Mayo Clinic, Cleveland Clinic, CDC, NIH, WHO, medical journals). Ensure accuracy of lab ranges, interpretations, and recommendations. Return only corrected JSON. IMPORTANT: Do not modify the metadata object.';

    const labValuesJson = JSON.stringify(labValues, null, 2);

    const userPrompt =
      `Review this medical lab values for accuracy. Verify:\n` +
      `1. Lab value reference ranges\n` +
      `2. Interpretations of abnormal values\n` +
      `3. Medical conclusions and recommendations\n` +
      `4. Lab value categorizations\n\n` +
      `Analysis JSON:\n${labValuesJson}\n\n` +
      `Original Text:\n${originalText}\n\n` +
      `Return ONLY corrected JSON with identical structure. No preamble, explanation, or text before/after JSON.`;

    const messages: PerplexityMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await this.createChatCompletion(messages, {
        temperature: 0.3, // Lower temperature for more accurate/factual responses
        maxTokens: 4000, // Ensure there's enough space for the full corrected labValues
        responseFormat: { type: 'json_object' }, // Use JSON mode for reliable JSON response
      });

      // Parse the response to get the corrected labValues
      const responseText = response.choices[0].message.content.trim();

      try {
        // Try to parse as JSON - Perplexity should return the corrected JSON
        const correctedLabValues = JSON.parse(responseText);
        return correctedLabValues;
      } catch (jsonParseError) {
        // If parsing fails, log the error but return the original labValues
        this.logger.error(
          `Failed to parse Perplexity review response as JSON: ${jsonParseError instanceof Error ? jsonParseError.message : 'Unknown error'}`,
        );
        return labValues;
      }
    } catch (error) {
      // If the API call fails, log the error but return the original labValues
      this.logger.error(
        `Error during medical labValues review: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return labValues;
    }
  }
}
