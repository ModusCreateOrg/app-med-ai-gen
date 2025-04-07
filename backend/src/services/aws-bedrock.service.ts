import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { RateLimiter } from '../utils/security.utils';
import { createHash } from 'crypto';

/**
 * Service for interacting with AWS Bedrock
 */
@Injectable()
export class AwsBedrockService {
  private readonly logger = new Logger(AwsBedrockService.name);
  private readonly client: BedrockRuntimeClient;
  private readonly defaultMaxTokens: number;
  private readonly rateLimiter: RateLimiter;
  private readonly modelId: string;
  private readonly inferenceProfileArn?: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('aws.region');
    const accessKeyId = this.configService.get<string>('aws.aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.aws.secretAccessKey');
    const sessionToken = this.configService.get<string>('aws.aws.sessionToken');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS configuration');
    }

    // Initialize AWS Bedrock client with credentials including session token if available
    this.client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken }), // Include session token if it exists
      },
    });

    // Log credential configuration for debugging (without exposing actual credentials)
    this.logger.log(
      `AWS client initialized with region ${region} and credentials ${accessKeyId ? '(provided)' : '(missing)'}, session token ${sessionToken ? '(provided)' : '(not provided)'}`,
    );

    // Set model ID from configuration with fallback to Claude 3.7
    this.modelId =
      this.configService.get<string>('aws.bedrock.model') ??
      'us.anthropic.claude-3-7-sonnet-20250219-v1:0';

    // Set inference profile ARN from configuration
    this.inferenceProfileArn =
      this.configService.get<string>('aws.bedrock.inferenceProfileArn') ??
      'arn:aws:bedrock:us-east-1:841162674562:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0';

    this.logger.log(
      `Using AWS Bedrock model: ${this.modelId}${this.inferenceProfileArn ? ' with inference profile' : ''}`,
    );

    // Set default values based on environment
    this.defaultMaxTokens =
      process.env.NODE_ENV === 'test'
        ? 1000
        : (this.configService.get<number>('aws.bedrock.maxTokens') ?? 2048);

    // Initialize rate limiter (10 requests per minute per IP)
    this.rateLimiter = new RateLimiter(60000, 10);
  }

  /**
   * Invokes the Bedrock model with the given prompt
   */
  private async invokeBedrock(prompt: string): Promise<InvokeModelCommandOutput> {
    // Determine which model to use
    const modelId = this.modelId;

    try {
      // Format request body based on the selected model
      const body = this.formatRequestBody(prompt);

      // Create the command
      const command = new InvokeModelCommand({
        modelId,
        body,
        ...(this.inferenceProfileArn && {
          inferenceProfileArn: this.inferenceProfileArn,
        }),
      });

      // Send request to AWS Bedrock
      const response = await this.client.send(command);

      return response;
    } catch (error: unknown) {
      // Handle specific errors
      if (error instanceof Error) {
        this.logger.error(`Bedrock model invocation failed: ${error.message}`, {
          modelId,
          errorName: error.name,
          stack: error.stack,
        });

        // Provide more helpful error messages based on error type
        if (error.name === 'AccessDeniedException') {
          throw new BadRequestException(
            'Access denied to AWS Bedrock. Check your credentials and permissions.',
          );
        } else if (error.name === 'ThrottlingException') {
          throw new BadRequestException(
            'Request throttled by AWS Bedrock. Please try again in a few moments.',
          );
        } else if (error.name === 'ValidationException') {
          throw new BadRequestException(
            `AWS Bedrock validation error: ${error.message}. Check your request parameters.`,
          );
        } else if (error.name === 'ServiceQuotaExceededException') {
          throw new BadRequestException(
            'AWS Bedrock service quota exceeded. Try again later or request a quota increase.',
          );
        }
      }

      throw new BadRequestException(
        `Failed to invoke AWS Bedrock: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Formats the request body based on the model being used
   */
  private formatRequestBody(prompt: string): string {
    return JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: this.defaultMaxTokens,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });
  }

  /**
   * Hash a string identifier for logging purposes
   */
  private hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier).digest('hex');
  }
}
