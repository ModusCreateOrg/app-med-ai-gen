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
  keyMedicalTerms: Array<{ term: string; definition: string }>;
  labValues: Array<{
    name: string;
    value: string;
    unit: string;
    normalRange: string;
    isAbnormal: boolean;
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
  private readonly medicalAnalysisPrompt = `Please analyze this medical document carefully, with specific attention to medical lab reports.

Look for and extract the following information:
1. Key medical terms visible in the document with their definitions
2. Lab test values with their normal ranges and whether they are abnormal (particularly important for blood work, metabolic panels, etc.)
3. Any diagnoses, findings, or medical observations with details and recommendations
4. Analyze if this is a medical document (lab report, test result, medical chart, prescription, etc.) and provide confidence level

This document may be a lab report showing blood work or other test results, so please pay special attention to tables, numeric values, reference ranges, and medical terminology.

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

Set isMedicalReport to true if you see ANY medical content such as lab values, medical terminology, doctor's notes, or prescription information.
Set confidence between 0 and 1 based on document clarity and how confident you are about the medical nature of the document.


This is extremely important: If you see ANY lab values, numbers with units, or medical terminology, please consider this a medical document even if you're not 100% certain. 

When extracting lab values:
1. Look for tables with numeric values and reference ranges
2. Include any values even if you're not sure of the meaning

EXTREMELY IMPORTANT FORMATTING INSTRUCTIONS:
1. ABSOLUTELY DO NOT START YOUR RESPONSE WITH ANY TEXT. Begin immediately with the JSON object.
2. Return ONLY the JSON object without any introduction, explanation, or text like "This appears to be a medical report..." 
3. Do NOT include phrases like "Here is the information" or "formatted in the requested JSON structure"
4. Do NOT write any text before the opening brace { or after the closing brace }
5. Do NOT wrap the JSON in code blocks or add comments
6. Do NOT nest JSON inside other JSON fields
7. Start your response with the opening brace { and end with the closing brace }
8. CRITICAL: Do NOT place JSON data inside a definition field or any other field. Return only the direct JSON format requested.
9. Do NOT put explanatory text about how you structured the analysis inside the JSON.
10. Always provide empty arrays ([]) rather than null for empty fields.
11. YOU MUST NOT create a "term" called "Here is the information extracted" or similar phrases.
12. NEVER put actual data inside a "definition" field of a medical term.

YOU REPEATEDLY MAKE THESE MISTAKES:
- You create a "term" field with text like "Here is the information extracted"
- You start your response with "This appears to be a medical report..."
- You write "Here is the information extracted in the requested JSON format:" before the JSON
- THESE ARE WRONG and cause our system to fail

INCORRECT RESPONSE FORMATS (DO NOT DO THESE):

1) DO NOT DO THIS - Adding explanatory text before JSON:
"This appears to be a medical report. Here is the information extracted in the requested JSON format:

{
  \"keyMedicalTerms\": [...],
  ...
}"

2) DO NOT DO THIS - Nested JSON:
{
  "keyMedicalTerms": [
    {
      "term": "Here is the information extracted",
      "definition": "{\"keyMedicalTerms\": [{\"term\": \"RBC\", \"definition\": \"Red blood cells\"}]}"
    }
  ]
}

CORRECT FORMAT (DO THIS):
{
  "keyMedicalTerms": [
    {"term": "RBC", "definition": "Red blood cells"},
    {"term": "WBC", "definition": "White blood cells"}
  ],
  "labValues": [...],
  "diagnoses": [...],
  "metadata": {...}
}

If any information is not visible or unclear in the document, list those items in the missingInformation array.
Ensure all visible medical terms are explained in plain language. Mark lab values as abnormal if they fall outside the normal range.

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
      !Array.isArray(response.keyMedicalTerms) ||
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
