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

  /**
   * Reviews and verifies a medical document analysis against trusted medical sources
   *
   * @param analysis The medical document analysis to review
   * @param originalText The original text of the medical document
   * @returns The corrected medical document analysis
   */
  async reviewMedicalAnalysis(analysis: any, originalText: string): Promise<any> {
    this.logger.log('Reviewing medical document analysis with Perplexity');

    const systemPrompt =
      'You are an AI assistant specializing in medical information verification.\n' +
      'Your task is to review a medical document analysis and verify it against trusted medical sources.\n' +
      'You must ensure all information is accurate, especially lab value reference ranges and interpretations.\n' +
      'Use authoritative medical sources like Mayo Clinic, Cleveland Clinic, CDC, NIH, WHO, and medical journals.\n';

    const analysisJson = JSON.stringify(analysis, null, 2);

    const userPrompt =
      `Please review the following medical document analysis for accuracy and completeness. ` +
      `Check if the lab value reference ranges, interpretations, and recommendations align with trusted medical sources. ` +
      `Focus on these key aspects:\n` +
      `1. Verify lab value reference ranges\n` +
      `2. Confirm interpretations of abnormal values\n` +
      `3. Validate medical conclusions and recommendations\n` +
      `4. Ensure all lab values are correctly categorized\n\n` +
      `If you find any discrepancies, provide corrections in your response by returning the corrected JSON directly.\n\n` +
      `Medical Document Analysis:\n${analysisJson}\n\n` +
      `Original Medical Document Text:\n${originalText}\n\n` +
      `Return the corrected JSON analysis with the same structure, no preamble or explanation needed.`;

    const messages: PerplexityMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await this.createChatCompletion(messages, {
        temperature: 0.3, // Lower temperature for more accurate/factual responses
        maxTokens: 4000, // Ensure there's enough space for the full corrected analysis
      });

      // Parse the response to get the corrected analysis
      const responseText = response.choices[0].message.content.trim();

      try {
        // Try to parse as JSON - Perplexity should return the corrected JSON
        const correctedAnalysis = JSON.parse(responseText);
        return correctedAnalysis;
      } catch (jsonParseError) {
        // If parsing fails, log the error but return the original analysis
        this.logger.error(
          `Failed to parse Perplexity review response as JSON: ${jsonParseError instanceof Error ? jsonParseError.message : 'Unknown error'}`,
        );
        return analysis;
      }
    } catch (error) {
      // If the API call fails, log the error but return the original analysis
      this.logger.error(
        `Error during medical analysis review: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return analysis;
    }
  }
}
