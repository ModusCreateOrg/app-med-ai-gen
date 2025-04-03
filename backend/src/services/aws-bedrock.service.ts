import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

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
}
