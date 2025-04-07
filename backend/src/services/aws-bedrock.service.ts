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
    this.client = this.initializeBedrockClient();
    this.modelId = this.configureModelId();
    this.inferenceProfileArn = this.configureInferenceProfileArn();
    this.defaultMaxTokens = this.configureMaxTokens();
    this.rateLimiter = this.initializeRateLimiter();
  }

  /**
   * Initialize the AWS Bedrock client with credentials
   */
  private initializeBedrockClient(): BedrockRuntimeClient {
    const region = this.configService.get<string>('aws.region');
    const accessKeyId = this.configService.get<string>('aws.aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.aws.secretAccessKey');
    const sessionToken = this.configService.get<string>('aws.aws.sessionToken');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS configuration');
    }

    const credentials = this.createCredentialsObject(accessKeyId, secretAccessKey, sessionToken);

    const client = new BedrockRuntimeClient({
      region,
      credentials,
    });

    this.logger.log(
      `AWS client initialized with region ${region} and credentials ${accessKeyId ? '(provided)' : '(missing)'}, session token ${sessionToken ? '(provided)' : '(not provided)'}`,
    );

    return client;
  }

  /**
   * Create AWS credentials object with proper typing
   */
  private createCredentialsObject(
    accessKeyId: string,
    secretAccessKey: string,
    sessionToken?: string,
  ): {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  } {
    const credentials = {
      accessKeyId,
      secretAccessKey,
    };

    if (sessionToken) {
      return { ...credentials, sessionToken };
    }

    return credentials;
  }

  /**
   * Configure the model ID from configuration with fallback
   */
  private configureModelId(): string {
    const modelId = this.configService.get<string>('aws.bedrock.model')!;

    this.logger.log(
      `Using AWS Bedrock model: ${modelId}${this.inferenceProfileArn ? ' with inference profile' : ''}`,
    );

    return modelId;
  }

  /**
   * Configure the inference profile ARN from configuration
   */
  private configureInferenceProfileArn(): string | undefined {
    const inferenceProfileArn = this.configService.get<string>('aws.bedrock.inferenceProfileArn');

    this.logger.log(
      `Using AWS Bedrock model: ${this.modelId}${inferenceProfileArn ? ' with inference profile' : ''}`,
    );

    return inferenceProfileArn;
  }

  /**
   * Configure max tokens based on environment
   */
  private configureMaxTokens(): number {
    return process.env.NODE_ENV === 'test'
      ? 1000
      : (this.configService.get<number>('aws.bedrock.maxTokens') ?? 2048);
  }

  /**
   * Initialize rate limiter for API requests
   */
  private initializeRateLimiter(): RateLimiter {
    const requestsPerMinute = this.configService.get<number>('aws.bedrock.requestsPerMinute') ?? 20;
    return new RateLimiter(60000, requestsPerMinute);
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

      // Create command parameters
      const commandParams = this.createCommandParams(modelId, body);

      // Create the command
      const command = new InvokeModelCommand(commandParams);

      // Send request to AWS Bedrock
      const response = await this.client.send(command);

      return response;
    } catch (error: unknown) {
      this.handleBedrockError(error, modelId);
    }
  }

  /**
   * Create command parameters for Bedrock invocation
   */
  private createCommandParams(
    modelId: string,
    body: any,
  ): {
    modelId: string;
    body: any;
    inferenceProfileArn?: string;
  } {
    const commandParams = {
      modelId,
      body,
    };

    // Add inference profile if available
    if (this.inferenceProfileArn) {
      return { ...commandParams, inferenceProfileArn: this.inferenceProfileArn };
    }

    return commandParams;
  }

  /**
   * Handle errors from Bedrock invocation
   */
  private handleBedrockError(error: unknown, modelId: string): never {
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

  /**
   * Generates a response using AWS Bedrock
   */
  async generateResponse(prompt: string): Promise<string> {
    // Check rate limiting
    if (!this.rateLimiter.tryRequest('global')) {
      throw new BadRequestException('Rate limit exceeded. Please try again later.');
    }

    const response = await this.invokeBedrock(prompt);

    // Parse the response
    const responseBody = JSON.parse(Buffer.from(response.body).toString('utf-8'));

    // Extract the generated content
    if (responseBody.content && responseBody.content.length > 0) {
      return responseBody.content[0].text;
    }

    throw new BadRequestException('Failed to generate a response from AWS Bedrock');
  }
}
