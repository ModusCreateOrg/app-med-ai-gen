import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { validateFileSecurely, sanitizeMedicalData, RateLimiter } from '../utils/security.utils';
import { createHash } from 'crypto';

export interface ExtractedMedicalInfo {
  keyMedicalTerms: Array<{
    term: string;
    definition: string;
  }>;
  labValues: Array<{
    name: string;
    value: string;
    unit: string;
    normalRange?: string;
    isAbnormal?: boolean;
  }>;
  diagnoses: Array<{
    condition: string;
    details: string;
    recommendations?: string;
  }>;
  metadata: {
    isMedicalReport: boolean;
    confidence: number;
    missingInformation: string[];
  };
}

/**
 * Service for interacting with AWS Bedrock
 */
@Injectable()
export class AwsBedrockService {
  private readonly logger = new Logger(AwsBedrockService.name);
  private readonly client: BedrockRuntimeClient;
  private readonly defaultModel: string;
  private readonly defaultMaxTokens: number;
  private readonly rateLimiter: RateLimiter;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('aws.region');
    const accessKeyId = this.configService.get<string>('aws.aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.aws.secretAccessKey');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS configuration');
    }

    // Initialize AWS Bedrock client
    this.client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Set default values based on environment
    this.defaultModel =
      process.env.NODE_ENV === 'test'
        ? 'anthropic.claude-3-7-sonnet-20250219-v1:0'
        : (this.configService.get<string>('bedrock.model') ??
          'anthropic.claude-3-7-sonnet-20250219-v1:0');

    this.defaultMaxTokens =
      process.env.NODE_ENV === 'test'
        ? 1000
        : (this.configService.get<number>('bedrock.maxTokens') ?? 2048);

    // Initialize rate limiter (10 requests per minute per IP)
    this.rateLimiter = new RateLimiter(60000, 10);
  }

  /**
   * Extracts medical information from an image using AWS Bedrock
   */
  async extractMedicalInfo(
    fileBuffer: Buffer,
    fileType: string,
    clientIp?: string,
  ): Promise<ExtractedMedicalInfo> {
    try {
      // 1. Rate limiting check
      if (clientIp && !this.rateLimiter.tryRequest(clientIp)) {
        throw new BadRequestException('Too many requests. Please try again later.');
      }

      // 2. Validate file securely (only images allowed)
      validateFileSecurely(fileBuffer, fileType);

      // 3. Prepare the prompt for medical information extraction from image
      const prompt = this.buildMedicalExtractionPrompt(fileBuffer.toString('base64'), fileType);

      // 4. Call Bedrock with proper error handling
      const response = await this.invokeBedrock(prompt);

      // 5. Parse and validate the response
      const extractedInfo = this.parseBedrockResponse(response);

      // 6. Validate medical report status
      if (!extractedInfo.metadata.isMedicalReport) {
        throw new BadRequestException(
          'The provided image does not appear to be a medical document.',
        );
      }

      // 7. Check confidence level
      if (extractedInfo.metadata.confidence < 0.7) {
        throw new BadRequestException('Low confidence in medical image analysis');
      }

      // 8. Sanitize the extracted data
      return sanitizeMedicalData(extractedInfo);
    } catch (error: unknown) {
      // Log error securely without exposing sensitive details
      this.logger.error('Error processing medical image', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileType,
        timestamp: new Date().toISOString(),
        clientIp: clientIp ? this.hashIdentifier(clientIp) : undefined,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to extract medical information from image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Builds the prompt for medical information extraction from images
   */
  private buildMedicalExtractionPrompt(base64Content: string, fileType: string): string {
    return JSON.stringify({
      prompt: `\n\nHuman: Please analyze this medical image and extract key information. The image is provided as a base64-encoded ${fileType} file: ${base64Content}

Please analyze the image carefully and extract the following information:
1. Key medical terms visible in the image with their definitions
2. Any visible lab values with their normal ranges and abnormalities
3. Any diagnoses, findings, or medical observations with details and recommendations
4. Analyze if this is a medical image (e.g., lab report, medical chart, prescription) and provide confidence level

Format the response as a JSON object with the following structure:
{
  "keyMedicalTerms": [{"term": string, "definition": string}],
  "labValues": [{"name": string, "value": string, "unit": string, "normalRange": string, "isAbnormal": boolean}],
  "diagnoses": [{"condition": string, "details": string, "recommendations": string}],
  "metadata": {
    "isMedicalReport": boolean,
    "confidence": number,
    "missingInformation": string[]
  }
}

If any information is not visible or unclear in the image, list those items in the missingInformation array.
Set confidence between 0 and 1 based on image clarity and how confident you are about the medical nature of the document.
Ensure all visible medical terms are explained in plain language. Mark lab values as abnormal if they fall outside the normal range.
If text in the image is not clear or partially visible, note this in the metadata.`,
    });
  }

  private async invokeBedrock(prompt: string): Promise<InvokeModelCommandOutput> {
    const command = new InvokeModelCommand({
      modelId: this.defaultModel,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: this.defaultMaxTokens,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
        ],
      }),
    });

    return await this.client.send(command);
  }

  private parseBedrockResponse(response: InvokeModelCommandOutput): ExtractedMedicalInfo {
    if (!response.body) {
      throw new Error('Empty response from Bedrock');
    }

    const responseBody = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(responseBody);

    const jsonMatch =
      parsedResponse.content.match(/```json\n([\s\S]*?)\n```/) ||
      parsedResponse.content.match(/{[\s\S]*?}/);

    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const extractedInfo: ExtractedMedicalInfo = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    return extractedInfo;
  }

  private hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier).digest('hex');
  }
}
