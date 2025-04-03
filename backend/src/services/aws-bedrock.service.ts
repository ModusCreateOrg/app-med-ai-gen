import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

export interface BedrockMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface BedrockRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
  anthropic_version?: string;
}

export interface ExtractedMedicalInfo {
  keyMedicalTerms: {
    term: string;
    definition: string;
  }[];
  labValues: {
    name: string;
    value: string;
    unit: string;
    normalRange?: string;
    isAbnormal?: boolean;
  }[];
  diagnoses: {
    condition: string;
    details: string;
    recommendations?: string;
  }[];
  metadata: {
    isMedicalReport: boolean;
    confidence: number;
    missingInformation?: string[];
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
  private readonly isTestEnv: boolean;

  constructor(private configService: ConfigService) {
    this.isTestEnv = process.env.NODE_ENV === 'test';

    // In test environment, use default values
    if (this.isTestEnv) {
      this.defaultModel = 'anthropic.claude-v2';
      this.defaultMaxTokens = 1000;
      this.client = new BedrockRuntimeClient({ region: 'us-east-1' });
    } else {
      const region = this.configService.get<string>('aws.region') || 'us-east-1';
      this.defaultModel = this.configService.get<string>('bedrock.model') || 'anthropic.claude-v2';
      this.defaultMaxTokens = this.configService.get<number>('bedrock.maxTokens') || 2048;

      this.client = new BedrockRuntimeClient({
        region,
        credentials: {
          accessKeyId: this.configService.get<string>('aws.aws.accessKeyId') || '',
          secretAccessKey: this.configService.get<string>('aws.aws.secretAccessKey') || '',
        },
      });
    }
  }

  /**
   * Extracts structured medical information from a file (PDF or image)
   *
   * @param fileBuffer The file buffer containing the medical report
   * @param fileType The MIME type of the file (e.g., 'application/pdf', 'image/jpeg')
   * @returns Structured medical information extracted from the file
   * @throws BadRequestException if the file is not a medical report or lacks sufficient information
   */
  async extractMedicalInfo(fileBuffer: Buffer, fileType: string): Promise<ExtractedMedicalInfo> {
    try {
      // Convert file to base64
      const base64File = fileBuffer.toString('base64');

      // Create the prompt with the file
      const systemPrompt = `You are a medical expert AI assistant. Analyze the provided document and determine if it's a medical report.
If it is a medical report, extract key information and assess the completeness of the information.

Format the response as a JSON object with the following structure:
{
  "keyMedicalTerms": [
    { "term": "string", "definition": "string" }
  ],
  "labValues": [
    { 
      "name": "string",
      "value": "string",
      "unit": "string",
      "normalRange": "string",
      "isAbnormal": boolean
    }
  ],
  "diagnoses": [
    {
      "condition": "string",
      "details": "string",
      "recommendations": "string"
    }
  ],
  "metadata": {
    "isMedicalReport": boolean,
    "confidence": number,
    "missingInformation": ["string"]
  }
}

If the document is not a medical report, set isMedicalReport to false and provide empty arrays for other fields.
If information is missing, list the missing elements in the missingInformation array.
Set confidence between 0 and 1 based on how confident you are about the medical nature and completeness of the document.
Ensure all medical terms are explained in plain language. Mark lab values as abnormal if they fall outside the normal range.`;

      const input: InvokeModelCommandInput = {
        modelId: this.defaultModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: this.defaultMaxTokens,
          temperature: 0.5,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: fileType,
                    data: base64File,
                  },
                },
                {
                  type: 'text',
                  text: 'Please analyze this document and extract the key information as specified.',
                },
              ],
            },
          ],
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);

      // Parse the response
      const responseBody = new TextDecoder().decode(response.body);
      const parsedResponse = JSON.parse(responseBody);

      // Extract the JSON from the response text
      // The model might wrap the JSON in markdown code blocks or add additional text
      const jsonMatch =
        parsedResponse.content.match(/```json\n([\s\S]*?)\n```/) ||
        parsedResponse.content.match(/{[\s\S]*}/);

      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from response');
      }

      const extractedInfo: ExtractedMedicalInfo = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      // Validate the response
      if (!extractedInfo.metadata.isMedicalReport) {
        throw new BadRequestException(
          'The provided document does not appear to be a medical report.',
        );
      }

      if (extractedInfo.metadata.confidence < 0.7) {
        throw new BadRequestException(
          'Low confidence in medical report analysis. Please ensure the document is clear and complete.',
        );
      }

      if (extractedInfo.metadata.missingInformation?.length) {
        this.logger.warn(
          `Missing information in medical report: ${extractedInfo.metadata.missingInformation.join(', ')}`,
        );
      }

      return extractedInfo;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to extract medical information: ${errorMessage}`);
      throw new Error(`Failed to extract medical information: ${errorMessage}`);
    }
  }
}
