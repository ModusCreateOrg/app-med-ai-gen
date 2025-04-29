import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { RateLimiter } from '../../utils/security.utils';
import { createHash } from 'crypto';

/**
 * Interface for medical document analysis result
 */
export interface MedicalDocumentAnalysis {
  title: string;
  category: string;
  labValues: Array<{
    name: string;
    value: string;
    unit: string;
    normalRange: string;
    status: 'normal' | 'high' | 'low';
    isCritical: boolean;
    conclusion: string;
    suggestions: string;
  }>;
  diagnoses: Array<{ condition: string; details: string; recommendations: string }>;
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
  private readonly defaultMaxTokens: number;
  private readonly rateLimiter: RateLimiter;
  private readonly modelId: string;
  private readonly inferenceProfileArn?: string;

  // Medical document analysis prompt
  private readonly medicalAnalysisPrompt = `Analyze this medical document with focus on lab reports. Extract:

1. Title/subject from content
2. Category: "heart" (cardiac focus), "brain" (neurological focus), or "general" (all else)
3. Lab values with ranges and status (normal/high/low)
4. Diagnoses, findings, and recommendations
5. Medical document verification with confidence level

Reference trusted sources: Mayo Clinic, Cleveland Clinic, CDC, NIH, WHO, AMA, etc.

Return ONLY a JSON object with this structure:
{
  "title": string,
  "category": string,
  "labValues": [{"name": string, "value": string, "unit": string, "normalRange": string, "status": "normal" | "high" | "low", "isCritical": boolean, "conclusion": string, "suggestions": string}],
  "diagnoses": [{"condition": string, "details": string, "recommendations": string}],
  "metadata": {
    "isMedicalReport": boolean,
    "confidence": number,
    "missingInformation": string[]
  }
}

For lab values:
- Set "isCritical" to true for urgent medical situations
- Provide brief "conclusion" about what the value means for health
- Add brief "suggestions" based on the value
- If you use standard ranges because the document lacks them, clearly mark this in your response

CRITICAL FORMATTING RULES:
- Begin immediately with { and end with }
- No text before/after the JSON
- No introduction, explanations, code blocks, or comments
- No nested JSON or definition fields
- Empty arrays ([]) for null fields
- No "term" fields with phrases like "Here is the information extracted"

Common errors to avoid:
- Adding explanatory text before JSON
- Starting with "This appears to be a medical report..."
- Creating nested JSON structures
- Placing data inside definition fields

Document text:
`;

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

    const clientConfig: any = { region };

    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken }),
      };
    }

    const client = new BedrockRuntimeClient(clientConfig);

    this.logger.log(
      `AWS client initialized with region ${region} and credentials ${accessKeyId ? '(provided)' : '(missing)'}, session token ${sessionToken ? '(provided)' : '(not provided)'}`,
    );

    return client;
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
   * @param prompt The prompt to send to the model
   * @param userId The authenticated user's ID for rate limiting
   * @returns The generated response text
   */
  async generateResponse(prompt: string, userId: string): Promise<string> {
    // Check rate limiting using user ID
    if (!this.rateLimiter.tryRequest(userId)) {
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

  /**
   * Analyzes a medical document using Claude model and returns structured data
   * @param documentText The text content of the medical document to analyze
   * @param userId The authenticated user's ID for rate limiting
   * @returns Structured analysis of the medical document
   */
  async analyzeMedicalDocument(
    documentText: string,
    userId: string,
  ): Promise<MedicalDocumentAnalysis> {
    // Check rate limiting using user ID
    if (!this.rateLimiter.tryRequest(userId)) {
      throw new BadRequestException('Rate limit exceeded. Please try again later.');
    }

    // Combine prompt with document text
    const fullPrompt = `${this.medicalAnalysisPrompt}${documentText}`;

    // Invoke Claude model
    const response = await this.invokeBedrock(fullPrompt);

    // Parse the response
    const responseBody = JSON.parse(Buffer.from(response.body).toString('utf-8'));

    // Extract the generated content
    if (responseBody.content && responseBody.content.length > 0) {
      try {
        // Parse the JSON response from the model
        const jsonResponse = JSON.parse(responseBody.content[0].text);

        // Validate the response structure
        this.validateMedicalAnalysisResponse(jsonResponse);

        return jsonResponse;
      } catch (error) {
        this.logger.error(
          `Failed to parse medical analysis response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        throw new BadRequestException('Failed to parse medical analysis from AWS Bedrock');
      }
    }

    throw new BadRequestException('Failed to generate a medical analysis from AWS Bedrock');
  }

  /**
   * Validates the structure of the medical analysis response
   */
  private validateMedicalAnalysisResponse(response: any): void {
    // Check if response has all required properties
    if (
      !response ||
      typeof response.title !== 'string' ||
      typeof response.category !== 'string' ||
      !Array.isArray(response.labValues) ||
      !Array.isArray(response.diagnoses) ||
      !response.metadata
    ) {
      throw new BadRequestException('Invalid medical analysis response structure');
    }

    // Verify metadata structure
    if (
      typeof response.metadata.isMedicalReport !== 'boolean' ||
      typeof response.metadata.confidence !== 'number' ||
      !Array.isArray(response.metadata.missingInformation)
    ) {
      throw new BadRequestException('Invalid metadata in medical analysis response');
    }
  }
}
