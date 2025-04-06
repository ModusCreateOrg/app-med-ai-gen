import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
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
  private readonly bedrockClient: BedrockClient;
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

    // Initialize AWS Bedrock management client for listing models
    this.bedrockClient = new BedrockClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken }),
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
      validateFileSecurely(fileBuffer, fileType, { skipEntropyCheck: true });

      // Add diagnostic information about the image being sent
      this.logger.debug('Processing image', {
        fileType,
        fileSize: `${(fileBuffer.length / 1024).toFixed(2)} KB`,
        imageDimensions: 'Not available in server context',
        contentHashPrefix: createHash('sha256').update(fileBuffer).digest('hex').substring(0, 10),
      });

      // 3. Prepare the prompt for medical information extraction from image
      const prompt = this.buildMedicalExtractionPrompt(fileBuffer.toString('base64'), fileType);

      // 4. Call Bedrock with proper error handling
      const response = await this.invokeBedrock(prompt);

      // 5. Parse and validate the response
      const extractedInfo = this.parseBedrockResponse(response);

      // Log response details for debugging
      this.logger.debug('Model response details', {
        modelId: this.modelId,
        isMedicalReport: extractedInfo.metadata.isMedicalReport,
        confidence: extractedInfo.metadata.confidence,
        missingInfoCount: extractedInfo.metadata.missingInformation.length,
        termsCount: extractedInfo.keyMedicalTerms.length,
        labValuesCount: extractedInfo.labValues.length,
        diagnosesCount: extractedInfo.diagnoses.length,
      });

      // 6. Validate medical report status
      if (!extractedInfo.metadata.isMedicalReport) {
        this.logger.warn('Image not identified as medical document', {
          confidence: extractedInfo.metadata.confidence,
          missingInfo: extractedInfo.metadata.missingInformation,
        });

        // Return data but with a warning flag instead of throwing error
        extractedInfo.metadata.missingInformation.push(
          'The image was not clearly identified as a medical document. Results may be limited.',
        );
        return sanitizeMedicalData(extractedInfo);
      }

      // 7. Check confidence level
      if (extractedInfo.metadata.confidence < 0.5) {
        this.logger.warn('Low confidence in medical image analysis', {
          confidence: extractedInfo.metadata.confidence,
          missingInfo: extractedInfo.metadata.missingInformation,
        });

        // Return data with warning instead of throwing error
        extractedInfo.metadata.missingInformation.push(
          'Low confidence in the analysis. Please verify results or try a clearer image.',
        );
        return sanitizeMedicalData(extractedInfo);
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
    // Common medical prompt instructions with more specificity for lab reports
    const detailedInstructions = `Please analyze this medical image carefully, with specific attention to lab reports such as CBC (Complete Blood Count), metabolic panels, or other laboratory test results.

Look for and extract the following information:
1. Key medical terms visible in the image with their definitions
2. Lab test values with their normal ranges and whether they are abnormal (particularly important for blood work, metabolic panels, etc.)
3. Any diagnoses, findings, or medical observations with details and recommendations
4. Analyze if this is a medical document (lab report, test result, medical chart, prescription, etc.) and provide confidence level

This image may be a lab report showing blood work or other test results, so please pay special attention to tables, numeric values, reference ranges, and medical terminology.

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
Set confidence between 0 and 1 based on image clarity and how confident you are about the medical nature of the document.
Look for blood cell counts, metabolic values, cholesterol levels, and other numerical medical data that may indicate this is a lab report.`;

    // Determine prompt format based on selected model
    if (this.modelId.includes('amazon.titan-image-generator')) {
      // For the Titan Image Generator, we don't include the base64 content in the prompt
      // The image generation models don't accept image data as input
      return `Analyze this medical document and extract key information:

${detailedInstructions}

If any information is not visible or unclear, list those items in the missingInformation array.
Ensure all visible medical terms are explained in plain language. Mark lab values as abnormal if they fall outside the normal range.`;
    } else if (this.modelId.includes('meta.llama')) {
      // Meta Llama 3 format
      // Llama 3 handles base64 images but needs the content in a special format with a clear system prompt
      return `<|system|>
You are a medical expert analyzing medical documents and images. Your task is to extract precise information from the image and present it in a structured JSON format.
</|system|>

<|user|>
Please analyze this medical image and extract key information. The image is provided as a base64-encoded ${fileType} file: ${base64Content}

${detailedInstructions}

Be comprehensive but precise. If any information is not visible or unclear in the image, list those items in the missingInformation array.
</|user|>

<|assistant|>`;
    } else if (this.modelId.includes('amazon.titan')) {
      return `Analyze this medical image and extract key information. The image is provided as a base64-encoded ${fileType} file: ${base64Content}

${detailedInstructions}

If any information is not visible or unclear in the image, list those items in the missingInformation array.
Ensure all visible medical terms are explained in plain language. Mark lab values as abnormal if they fall outside the normal range.
If text in the image is not clear or partially visible, note this in the metadata.`;
    } else if (this.modelId.includes('anthropic.claude')) {
      // Claude model uses a different format
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
                text: `Please analyze this medical image carefully. It may be a CBC (Complete Blood Count) report or other lab result.

${detailedInstructions}

This is extremely important: If you see ANY lab values, numbers with units, or medical terminology, please consider this a medical document even if you're not 100% certain. 

When extracting lab values:
1. Look for tables with numeric values and reference ranges
2. Pay attention to blood counts, hemoglobin, white/red blood cells, platelets
3. Include any values even if you're not sure of the meaning
4. For CBC reports, common values include: RBC, WBC, Hemoglobin, Hematocrit, Platelets, MCH, MCHC, MCV

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

JSON format:
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
Ensure all visible medical terms are explained in plain language. Mark lab values as abnormal if they fall outside the normal range.`,
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: fileType,
                  data: base64Content,
                },
              },
            ],
          },
        ],
      });
    } else if (this.modelId.includes('amazon.nova')) {
      // Amazon Nova model format which requires messages array
      const medicalInstructionText = `Please analyze this medical image and extract key information.
      
${detailedInstructions}
      
If any information is not visible or unclear in the image, list those items in the missingInformation array.
Ensure all visible medical terms are explained in plain language. Mark lab values as abnormal if they fall outside the normal range.
If text in the image is not clear or partially visible, note this in the metadata.`;

      return JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              { text: medicalInstructionText },
              {
                image: {
                  format: fileType.split('/')[1] || 'jpeg',
                  source: {
                    bytes: base64Content,
                  },
                },
              },
            ],
          },
        ],
      });
    } else {
      // Generic format
      return JSON.stringify({
        prompt: `Analyze this medical image: ${base64Content}`,
        instructions: detailedInstructions,
      });
    }
  }

  private async invokeBedrock(prompt: string): Promise<InvokeModelCommandOutput> {
    try {
      this.logger.log(`Invoking Bedrock model: ${this.modelId}`);

      // For Nova models, prompt is already properly formatted as JSON
      const requestBody = this.modelId.includes('amazon.nova')
        ? prompt
        : this.formatRequestBody(prompt);

      // Use the inference profile for Claude 3.7
      if (this.inferenceProfileArn && this.modelId.includes('claude-3-7')) {
        this.logger.log(`Using inference profile: ${this.inferenceProfileArn}`);

        // For models that need inference profiles, we use the profile ARN as modelId
        const command = new InvokeModelCommand({
          modelId: this.inferenceProfileArn, // This is the key change!
          contentType: 'application/json',
          accept: 'application/json',
          body: requestBody,
        });

        this.logger.debug('Request details:', {
          inferenceProfileArn: this.inferenceProfileArn,
          hasInferenceProfile: true,
          commandInputKeys: Object.keys(command.input),
        });

        const response = await this.client.send(command);
        this.logger.log('Received response from AWS Bedrock with inference profile');

        return response;
      } else if (this.inferenceProfileArn && this.modelId.includes('meta.llama')) {
        // Existing code for Llama models with inference profiles
        this.logger.log(`Using inference profile: ${this.inferenceProfileArn}`);

        // For models that need inference profiles, we use the profile ARN as modelId
        const command = new InvokeModelCommand({
          modelId: this.inferenceProfileArn,
          contentType: 'application/json',
          accept: 'application/json',
          body: requestBody,
        });

        this.logger.debug('Request details:', {
          inferenceProfileArn: this.inferenceProfileArn,
          hasInferenceProfile: true,
          commandInputKeys: Object.keys(command.input),
        });

        const response = await this.client.send(command);
        this.logger.log('Received response from AWS Bedrock with inference profile');

        return response;
      } else {
        // Standard invocation without inference profile
        const command = new InvokeModelCommand({
          modelId: this.modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: requestBody,
        });

        this.logger.debug('Request details:', {
          modelId: this.modelId,
          hasInferenceProfile: false,
          commandInputKeys: Object.keys(command.input),
        });

        const response = await this.client.send(command);
        this.logger.log('Received response from AWS Bedrock');

        return response;
      }
    } catch (error) {
      this.logger.error('Error invoking AWS Bedrock', {
        error: error instanceof Error ? error.message : 'Unknown error',
        modelId: this.modelId,
        hasInferenceProfile: !!this.inferenceProfileArn,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Log more detailed info about the error
      if (error instanceof Error && error.message.includes('inference profile')) {
        this.logger.error('Inference profile error details', {
          message: error.message,
          modelId: this.modelId,
          inferenceProfileArn: this.inferenceProfileArn ?? 'not set',
        });
      }

      throw error;
    }
  }

  private formatRequestBody(prompt: string): string {
    // Different models use different request formats
    if (this.modelId.includes('amazon.titan-image-generator')) {
      // Amazon Titan Image Generator model request format
      return JSON.stringify({
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: prompt,
          negativeText: '',
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          height: 512,
          width: 512,
          cfgScale: 8.0,
        },
      });
    } else if (this.modelId.includes('meta.llama')) {
      // Meta Llama model request format
      return JSON.stringify({
        prompt: prompt,
        max_gen_len: this.defaultMaxTokens,
        temperature: 0.7,
        top_p: 0.9,
      });
    } else if (this.modelId.includes('amazon.titan')) {
      // Amazon Titan model request format
      return JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: this.defaultMaxTokens,
          temperature: 0.7,
          topP: 0.9,
        },
      });
    } else if (this.modelId.includes('anthropic.claude')) {
      // Claude model request format
      return JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: this.defaultMaxTokens,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
    } else {
      // Generic format for other models
      return JSON.stringify({
        prompt: prompt,
        max_tokens: this.defaultMaxTokens,
        temperature: 0.7,
      });
    }
  }

  private parseBedrockResponse(response: InvokeModelCommandOutput): ExtractedMedicalInfo {
    if (!response.body) {
      throw new Error('Empty response from Bedrock');
    }

    const responseBody = new TextDecoder().decode(response.body);
    this.logger.log('Parsing response body from Bedrock');

    // Add full response logging to diagnose issues - but limit to first 4000 chars for safety
    if (this.modelId.includes('anthropic.claude')) {
      this.logger.debug('FULL RAW CLAUDE RESPONSE:', {
        responseBodySample:
          responseBody.substring(0, 4000) + (responseBody.length > 4000 ? '...(truncated)' : ''),
      });
    }

    try {
      const parsedResponse = JSON.parse(responseBody);
      this.logger.debug('Response format:', { keys: Object.keys(parsedResponse) });

      // Create initial empty structure to compare against later
      const initialExtractedInfo: ExtractedMedicalInfo = {
        keyMedicalTerms: [],
        labValues: [],
        diagnoses: [],
        metadata: {
          isMedicalReport: false,
          confidence: 0,
          missingInformation: ['Failed to parse response'],
        },
      };

      let extractedInfo: ExtractedMedicalInfo = { ...initialExtractedInfo };

      // Handle different model response formats
      if (this.modelId.includes('amazon.titan-image-generator')) {
        // For Titan Image Generator models
        this.logger.log('Parsing Titan Image Generator model response');

        // Titan Image Generator gives image URLs, not medical analysis
        // Since this isn't an analysis model, return a more appropriate error message
        extractedInfo = {
          keyMedicalTerms: [],
          labValues: [],
          diagnoses: [],
          metadata: {
            isMedicalReport: false,
            confidence: 0,
            missingInformation: [
              'Titan Image Generator is not a medical analysis model',
              'Please switch to an appropriate text analysis model like Claude or Nova',
            ],
          },
        };
      } else if (this.modelId.includes('meta.llama')) {
        // For Meta Llama models
        this.logger.log('Parsing Meta Llama model response');
        this.logger.debug('Llama response structure:', {
          responseKeys: Object.keys(parsedResponse),
          responseType: typeof parsedResponse,
          responseLength: JSON.stringify(parsedResponse).length,
        });

        // Get the generated text from the model - try multiple possible response structures
        const generatedText =
          parsedResponse.generation ??
          parsedResponse.text ??
          parsedResponse.output ??
          parsedResponse.completion ??
          (typeof parsedResponse === 'string' ? parsedResponse : '') ??
          '';

        this.logger.debug('Llama raw text (first 500 chars):', {
          textPreview: generatedText.substring(0, 500),
          textLength: generatedText.length,
        });

        try {
          // Try multiple ways to extract JSON
          // 1. First try to extract JSON block with delimiters
          let jsonMatch = generatedText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);

          // 2. Try extracting any JSON-like structure
          if (!jsonMatch) {
            jsonMatch = generatedText.match(/{[\s\S]*?}/);
          }

          // 3. Check if the entire response is a JSON string
          if (
            !jsonMatch &&
            generatedText.trim().startsWith('{') &&
            generatedText.trim().endsWith('}')
          ) {
            jsonMatch = [generatedText.trim()];
          }

          if (jsonMatch) {
            const jsonText = jsonMatch[1] || jsonMatch[0];
            this.logger.debug('Found JSON text:', {
              jsonPreview: jsonText.substring(0, 200),
              jsonLength: jsonText.length,
            });

            try {
              // Attempt to parse the extracted JSON
              extractedInfo = JSON.parse(jsonText);
              this.logger.log('Successfully parsed JSON from Llama response');

              // Validate the extracted info has the expected structure
              if (!extractedInfo.metadata) {
                extractedInfo.metadata = {
                  isMedicalReport: true,
                  confidence: 0.7,
                  missingInformation: [],
                };
              }

              if (!Array.isArray(extractedInfo.keyMedicalTerms)) {
                extractedInfo.keyMedicalTerms = [];
              }

              if (!Array.isArray(extractedInfo.labValues)) {
                extractedInfo.labValues = [];
              }

              if (!Array.isArray(extractedInfo.diagnoses)) {
                extractedInfo.diagnoses = [];
              }
            } catch (jsonParseError) {
              this.logger.warn('JSON parse error for extracted match:', {
                error: jsonParseError instanceof Error ? jsonParseError.message : 'Unknown error',
                jsonTextSample: jsonText.substring(0, 100) + '...',
              });
              throw jsonParseError; // Re-throw to be caught by outer catch
            }
          } else {
            this.logger.warn('No JSON pattern found in Llama response', {
              textPreview: generatedText.substring(0, 300) + '...',
            });
            throw new Error('No JSON found in Llama response');
          }
        } catch (jsonError) {
          this.logger.warn('Failed to extract JSON from Llama output', {
            error: jsonError instanceof Error ? jsonError.message : 'Unknown error',
            textPreview: generatedText.substring(0, 200) + '...',
          });

          // Extract any medical terms identified even if full JSON parsing failed
          const medicalTerms: Array<{ term: string; definition: string }> = [];

          // Try to extract any key medical terms mentioned
          const medicalTermMatches = generatedText.matchAll(
            /([A-Z][a-zA-Z\s]+)(?:\s*[-:]\s*|\s*–\s*)([^.]+)/g,
          );
          for (const match of medicalTermMatches) {
            if (match[1] && match[2]) {
              medicalTerms.push({
                term: match[1].trim(),
                definition: match[2].trim(),
              });
            }
          }

          // Try to find any lab values mentioned
          const labValueMatches = generatedText.matchAll(
            /([A-Za-z\s]+)(?:\s*[-:]\s*|\s*–\s*)([0-9.]+)(?:\s*([a-zA-Z/%]+))?(?:\s*\(normal(?:\s*range)?[:\s]\s*([^)]+)\))?\s*(?:(?:abnormal|high|low|elevated|decreased))?/g,
          );
          const labValues = [];

          for (const match of labValueMatches) {
            if (match[1] && match[2]) {
              labValues.push({
                name: match[1].trim(),
                value: match[2].trim(),
                unit: match[3] ? match[3].trim() : '',
                normalRange: match[4] ? match[4].trim() : '',
                isAbnormal: /abnormal|high|low|elevated|decreased/i.test(match[0]),
              });
            }
          }

          // Fallback to a basic structure with extracted info
          extractedInfo = {
            keyMedicalTerms: medicalTerms.length > 0 ? medicalTerms : [],
            labValues: labValues.length > 0 ? labValues : [],
            diagnoses: [],
            metadata: {
              isMedicalReport: true,
              confidence: 0.6,
              missingInformation: [
                'Some structured data was extracted from image but complete JSON parsing failed',
              ],
            },
          };

          if (medicalTerms.length > 0 || labValues.length > 0) {
            this.logger.log('Extracted partial information without full JSON parsing', {
              termCount: medicalTerms.length,
              labValueCount: labValues.length,
            });
          }
        }
      } else if (this.modelId.includes('amazon.titan')) {
        // For Amazon Titan models
        const outputText =
          parsedResponse.results?.[0]?.outputText ||
          parsedResponse.outputText ||
          parsedResponse.generated_text ||
          '';

        this.logger.log('Extracted text from Titan model');

        // Try to extract JSON from the text output
        try {
          // Look for JSON in the text
          const jsonMatch =
            outputText.match(/```json\n([\s\S]*?)\n```/) || outputText.match(/{[\s\S]*?}/);

          if (jsonMatch) {
            extractedInfo = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (jsonError) {
          this.logger.warn('Failed to parse JSON from output, using fallback format', jsonError);

          // Fallback to a basic structure with the raw text
          extractedInfo = {
            keyMedicalTerms: [],
            labValues: [],
            diagnoses: [],
            metadata: {
              isMedicalReport: true,
              confidence: 0.5,
              missingInformation: ['Could not extract structured data from image'],
            },
          };
        }
      } else if (this.modelId.includes('anthropic.claude')) {
        // For Claude models
        this.logger.debug('Claude response structure:', {
          responseKeys: Object.keys(parsedResponse),
          responseType: typeof parsedResponse,
          responseLength: JSON.stringify(parsedResponse).length,
        });

        // Get content from different possible Claude response formats
        let claudeContent = '';

        // Check different Claude response structures
        if (parsedResponse.content && typeof parsedResponse.content === 'string') {
          // Direct content string
          claudeContent = parsedResponse.content;
        } else if (parsedResponse.completion && typeof parsedResponse.completion === 'string') {
          // Completion field (older Claude models)
          claudeContent = parsedResponse.completion;
        } else if (parsedResponse.content && Array.isArray(parsedResponse.content)) {
          // Content array (newer Claude 3 models)
          this.logger.debug('Processing Claude 3 content array', {
            contentLength: parsedResponse.content.length,
            contentTypes: parsedResponse.content.map((item: any) => item.type).join(', '),
          });

          // Define a type for Claude content items
          interface ClaudeContentItem {
            type: string;
            text?: string;
            [key: string]: any;
          }

          for (const item of parsedResponse.content as ClaudeContentItem[]) {
            if (item.type === 'text' && typeof item.text === 'string') {
              claudeContent += item.text;

              // Debug the actual text content to see what Claude is returning
              this.logger.debug('Claude content text item preview:', {
                textPreview: item.text.substring(0, 200) + (item.text.length > 200 ? '...' : ''),
                containsJsonMarker: item.text.includes('{'),
                length: item.text.length,
              });
            }
          }
        } else if (parsedResponse.content?.message?.content) {
          // Nested content structure
          claudeContent = parsedResponse.content.message.content;
        } else if (parsedResponse.stop_reason === 'stop_sequence' && parsedResponse.output) {
          // Another Claude format with output field
          claudeContent = parsedResponse.output;
        } else {
          // Try to find any string property that might contain the response
          for (const key of Object.keys(parsedResponse)) {
            if (typeof parsedResponse[key] === 'string' && parsedResponse[key].includes('{')) {
              claudeContent = parsedResponse[key];
              break;
            }
          }
        }

        this.logger.debug('Claude content preview:', {
          contentPreview: claudeContent.substring(0, 200),
          contentLength: claudeContent.length,
        });

        if (!claudeContent) {
          this.logger.warn('Could not find content in Claude response', {
            responseStructure: JSON.stringify(parsedResponse).substring(0, 500),
          });
          throw new Error('No content found in Claude response');
        }

        try {
          // New pattern detection for Claude 3 explanatory text pattern
          const explanatoryTextPatterns = [
            /^This appears to be a medical report.*?Here is the information extracted in the requested JSON format:\s*\n/s,
            /^I've analyzed this medical (document|image).*?Here is the extracted information in JSON format:\s*\n/s,
            /^From the medical (report|image) provided.*?Here is the structured JSON information:\s*\n/s,
            /^The (image|document) shows a medical report.*?Below is the extracted information in JSON format:\s*\n/s,
            /^This (is|looks like) a medical (document|report|test result).*?information in the requested format:\s*\n/s,
            /^Based on the medical (image|document).*?Here('s| is) the information formatted as JSON:\s*\n/s,
          ];

          let matchFound = false;
          for (const pattern of explanatoryTextPatterns) {
            if (claudeContent.match(pattern)) {
              this.logger.log(
                'Detected Claude 3 explanatory text pattern, extracting JSON that follows',
              );

              // Remove the explanatory text
              const jsonContent = claudeContent.replace(pattern, '');
              this.logger.debug('Cleaned content preview:', {
                contentPreview: jsonContent.substring(0, 200),
                contentLength: jsonContent.length,
              });

              claudeContent = jsonContent;
              matchFound = true;
              break;
            }
          }

          if (!matchFound && claudeContent.includes('JSON format') && claudeContent.includes('{')) {
            // Try a more aggressive approach if we have text followed by JSON
            const jsonStartIndex = claudeContent.indexOf('{');
            if (jsonStartIndex > 20) {
              // There's substantial text before the first {
              this.logger.log(
                'Using aggressive JSON extraction - removing all text before first JSON marker',
              );
              claudeContent = claudeContent.substring(jsonStartIndex);
              this.logger.debug('Aggressively cleaned content:', {
                contentPreview: claudeContent.substring(0, 200),
                contentLength: claudeContent.length,
              });
            }
          }

          // Special case: Check for nested JSON response
          const extractNestedJson = (text: string): ExtractedMedicalInfo | null => {
            try {
              // Try to find a valid JSON object within the text
              const jsonMatch = text.match(/{[\s\S]*?}/);
              if (jsonMatch) {
                const potentialJson = JSON.parse(jsonMatch[0]);
                // Verify this has the right structure to be our expected medical info
                if (
                  potentialJson.keyMedicalTerms ||
                  potentialJson.labValues ||
                  potentialJson.metadata ||
                  potentialJson.diagnoses
                ) {
                  return potentialJson;
                }
              }
              return null;
            } catch (e) {
              return null;
            }
          };

          // Add a more robust method for incomplete JSON extraction
          const extractPartialJson = (text: string): ExtractedMedicalInfo | null => {
            try {
              // Look for the start of a JSON object with key fields we expect
              const startMatches = text.match(/\{\s*"keyMedicalTerms"\s*:\s*\[/);
              if (startMatches) {
                // Try to reconstruct a complete JSON object
                let count = 1; // Count opening braces
                let pos = startMatches.index! + 1; // Start after the first {

                while (count > 0 && pos < text.length) {
                  if (text[pos] === '{') count++;
                  if (text[pos] === '}') count--;
                  pos++;
                }

                if (count === 0) {
                  // We found a complete JSON object
                  const jsonSubstring = text.substring(startMatches.index!, pos);
                  try {
                    const parsed = JSON.parse(jsonSubstring);
                    if (parsed.keyMedicalTerms || parsed.labValues || parsed.metadata) {
                      return parsed;
                    }
                  } catch (e) {
                    // Still failed to parse the extracted JSON
                  }
                }

                // If we couldn't find a complete object or parse it correctly,
                // try our best to extract useful data
                const termsMatch = text.match(/"keyMedicalTerms"\s*:\s*(\[[\s\S]*?\])/);
                const labsMatch = text.match(/"labValues"\s*:\s*(\[[\s\S]*?\])/);
                const metadataMatch = text.match(/"metadata"\s*:\s*(\{[\s\S]*?\})/);
                const diagnosesMatch = text.match(/"diagnoses"\s*:\s*(\[[\s\S]*?\])/);

                if (termsMatch || labsMatch || metadataMatch || diagnosesMatch) {
                  const result: ExtractedMedicalInfo = {
                    keyMedicalTerms: [],
                    labValues: [],
                    diagnoses: [],
                    metadata: {
                      isMedicalReport: true,
                      confidence: 0.6,
                      missingInformation: ['Reconstructed from partial JSON'],
                    },
                  };

                  // Try to parse each section if available
                  if (termsMatch) {
                    try {
                      result.keyMedicalTerms = JSON.parse(termsMatch[1]);
                    } catch (e) {
                      /* ignore parse errors */
                    }
                  }

                  if (labsMatch) {
                    try {
                      result.labValues = JSON.parse(labsMatch[1]);
                    } catch (e) {
                      /* ignore parse errors */
                    }
                  }

                  if (diagnosesMatch) {
                    try {
                      result.diagnoses = JSON.parse(diagnosesMatch[1]);
                    } catch (e) {
                      /* ignore parse errors */
                    }
                  }

                  if (metadataMatch) {
                    try {
                      result.metadata = JSON.parse(metadataMatch[1]);
                    } catch (e) {
                      /* ignore parse errors */
                    }
                  }

                  return result;
                }
              }
              return null;
            } catch (e) {
              return null;
            }
          };

          // First check if Claude wrapped the whole response in a descriptive JSON pattern
          if (
            claudeContent.includes('"term": "Here is the information extracted"') ||
            claudeContent.includes('"term": "Information extracted from') ||
            claudeContent.includes('"term": "Analysis of the medical') ||
            claudeContent.includes(
              '"term": "Here is the information extracted in the requested JSON format"',
            )
          ) {
            this.logger.log(
              'Detected Claude descriptive wrapper pattern, checking for nested JSON',
            );

            try {
              const parsed = JSON.parse(claudeContent);
              this.logger.debug('Successfully parsed outer Claude wrapper JSON structure', {
                keyMedicalTermsCount: parsed.keyMedicalTerms?.length ?? 0,
                hasLabValues: !!parsed.labValues,
                hasDiagnoses: !!parsed.diagnoses,
                hasMetadata: !!parsed.metadata,
              });

              if (parsed.keyMedicalTerms?.length > 0) {
                // Check the first term's definition for a nested JSON structure
                const firstTerm = parsed.keyMedicalTerms[0];
                this.logger.debug('Examining first keyMedicalTerm for nested JSON', {
                  term: firstTerm.term,
                  definitionExcerpt: firstTerm.definition
                    ? firstTerm.definition.substring(0, 200) + '...'
                    : 'undefined',
                  hasOpeningBrace: firstTerm.definition?.includes('{') ?? false,
                  hasKeyMedicalTerms: firstTerm.definition?.includes('"keyMedicalTerms"') ?? false,
                });

                if (firstTerm.definition && typeof firstTerm.definition === 'string') {
                  // First try to extract a complete JSON object
                  const nested = extractNestedJson(firstTerm.definition);

                  if (nested) {
                    this.logger.log('Successfully extracted nested JSON from definition field');
                    extractedInfo = nested;
                  } else if (
                    firstTerm.definition.includes('{') &&
                    firstTerm.definition.includes('"keyMedicalTerms"')
                  ) {
                    // If we couldn't get a complete JSON object, try to extract parts
                    this.logger.debug('Attempting partial JSON extraction from definition field');
                    const partialNested = extractPartialJson(firstTerm.definition);

                    if (partialNested) {
                      this.logger.log(
                        'Successfully extracted partial nested JSON from definition field',
                        {
                          keyMedicalTermsCount: partialNested.keyMedicalTerms?.length ?? 0,
                          labValuesCount: partialNested.labValues?.length ?? 0,
                          diagnosesCount: partialNested.diagnoses?.length ?? 0,
                          hasMetadata: !!partialNested.metadata,
                        },
                      );
                      extractedInfo = partialNested;
                    } else {
                      this.logger.warn(
                        'Failed to extract partial nested JSON despite finding JSON markers',
                      );
                    }
                  } else {
                    this.logger.debug('Definition field does not contain nested JSON indicators');
                  }
                }

                // If we managed to extract JSON, finalize the data structure
                if (extractedInfo !== initialExtractedInfo) {
                  // Make sure to validate the structure
                  if (!extractedInfo.metadata) {
                    extractedInfo.metadata = {
                      isMedicalReport: true,
                      confidence: 0.7,
                      missingInformation: [],
                    };
                  }

                  if (!Array.isArray(extractedInfo.keyMedicalTerms)) {
                    extractedInfo.keyMedicalTerms = [];
                  }

                  if (!Array.isArray(extractedInfo.labValues)) {
                    extractedInfo.labValues = [];
                  }

                  if (!Array.isArray(extractedInfo.diagnoses)) {
                    extractedInfo.diagnoses = [];
                  }

                  // No need to continue with further parsing
                  return extractedInfo;
                }
              }
            } catch (parseError) {
              this.logger.warn('Error parsing wrapped Claude response', {
                error: parseError instanceof Error ? parseError.message : 'Unknown error',
              });
              // Continue with normal parsing attempts
            }
          }

          // Continue with normal JSON extraction methods
          // 1. First try to extract JSON block with delimiters
          let jsonMatch = claudeContent.match(/```(?:json)?\n?([\s\S]*?)\n?```/);

          // 2. Try extracting any JSON-like structure
          if (!jsonMatch) {
            // If the content starts with a curly brace and ends with one, treat the whole content as JSON
            if (claudeContent.trim().startsWith('{') && claudeContent.trim().endsWith('}')) {
              try {
                // Try to parse the content directly since it looks like complete JSON
                this.logger.log('Content appears to be complete JSON, attempting direct parse');
                const directResult = JSON.parse(claudeContent);

                // If we successfully parsed and it has the expected structure, use it
                if (
                  directResult.keyMedicalTerms !== undefined ||
                  directResult.labValues !== undefined ||
                  directResult.metadata !== undefined
                ) {
                  this.logger.log('Successfully parsed complete JSON directly');
                  return directResult;
                }
              } catch (directParseError) {
                this.logger.warn(
                  'Failed to parse content as complete JSON despite correct format',
                  {
                    error:
                      directParseError instanceof Error
                        ? directParseError.message
                        : 'Unknown error',
                  },
                );
                // Continue with regex-based extraction
              }
            }

            // Use a more robust regex that gets the entire JSON object, not just the first match
            const fullJsonMatch = claudeContent.match(/{[\s\S]*}/);
            if (fullJsonMatch) {
              jsonMatch = [fullJsonMatch[0]];
              this.logger.debug('Found full JSON content with robust regex', {
                matchLength: fullJsonMatch[0].length,
              });
            }
          }

          // 3. Check if the entire response is a JSON string
          if (
            !jsonMatch &&
            claudeContent.trim().startsWith('{') &&
            claudeContent.trim().endsWith('}')
          ) {
            jsonMatch = [claudeContent.trim()];
          }

          if (jsonMatch) {
            const jsonText = jsonMatch[1] || jsonMatch[0];
            this.logger.debug('Found JSON text from Claude:', {
              jsonPreview: jsonText.substring(0, 200),
              jsonLength: jsonText.length,
            });

            try {
              // Attempt to parse the extracted JSON
              extractedInfo = JSON.parse(jsonText);
              this.logger.log('Successfully parsed JSON from Claude response');

              // Validate the extracted info has the expected structure
              if (!extractedInfo.metadata) {
                extractedInfo.metadata = {
                  isMedicalReport: true,
                  confidence: 0.7,
                  missingInformation: [],
                };
              }

              if (!Array.isArray(extractedInfo.keyMedicalTerms)) {
                extractedInfo.keyMedicalTerms = [];
              }

              if (!Array.isArray(extractedInfo.labValues)) {
                extractedInfo.labValues = [];
              }

              if (!Array.isArray(extractedInfo.diagnoses)) {
                extractedInfo.diagnoses = [];
              }
            } catch (jsonParseError) {
              this.logger.warn('JSON parse error for extracted match from Claude:', {
                error: jsonParseError instanceof Error ? jsonParseError.message : 'Unknown error',
                jsonTextSample: jsonText.substring(0, 100) + '...',
              });
              throw jsonParseError;
            }
          } else {
            this.logger.warn('No JSON pattern found in Claude response', {
              contentPreview: claudeContent.substring(0, 300) + '...',
            });
            throw new Error('No JSON found in Claude response');
          }
        } catch (error) {
          this.logger.warn('Failed to extract JSON from Claude output', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Extract any medical terms identified even if full JSON parsing failed
          const medicalTerms: Array<{ term: string; definition: string }> = [];
          const labValues: Array<{
            name: string;
            value: string;
            unit: string;
            normalRange?: string;
            isAbnormal?: boolean;
          }> = [];

          // Try to extract any key medical terms mentioned
          try {
            const medicalTermMatches = claudeContent.matchAll(
              /([A-Z][a-zA-Z\s]+)(?:\s*[-:]\s*|\s*–\s*)([^.]+)/g,
            );
            for (const match of Array.from(medicalTermMatches)) {
              if (match[1] && match[2]) {
                medicalTerms.push({
                  term: match[1].trim(),
                  definition: match[2].trim(),
                });
              }
            }
          } catch (regexError) {
            this.logger.warn('Error parsing medical terms with regex', {
              error: regexError instanceof Error ? regexError.message : 'Unknown error',
            });
          }

          // Try to find any lab values mentioned
          try {
            const labValueRegex =
              /([A-Za-z\s]+)(?:\s*[-:]\s*|\s*–\s*)([0-9.]+)(?:\s*([a-zA-Z/%]+))?(?:\s*\(normal(?:\s*range)?[:\s]\s*([^)]+)\))?\s*(?:(?:abnormal|high|low|elevated|decreased))?/g;
            const labValueMatches = claudeContent.matchAll(labValueRegex);

            for (const match of Array.from(labValueMatches)) {
              if (match[1] && match[2]) {
                labValues.push({
                  name: match[1].trim(),
                  value: match[2].trim(),
                  unit: match[3] ? match[3].trim() : '',
                  normalRange: match[4] ? match[4].trim() : '',
                  isAbnormal: /abnormal|high|low|elevated|decreased/i.test(match[0]),
                });
              }
            }
          } catch (regexError) {
            this.logger.warn('Error parsing lab values with regex', {
              error: regexError instanceof Error ? regexError.message : 'Unknown error',
            });
          }

          // If we couldn't extract enough with simple regex, try dedicated CBC extraction
          if (medicalTerms.length < 3 && labValues.length < 3) {
            this.logger.log('Attempting specialized CBC extraction as fallback');
            const cbcResult = this.extractCbcValuesFromText(claudeContent);

            if (cbcResult.keyMedicalTerms.length > 0 || cbcResult.labValues.length > 0) {
              this.logger.log('CBC extraction successful', {
                termCount: cbcResult.keyMedicalTerms.length,
                labValueCount: cbcResult.labValues.length,
              });
              return cbcResult;
            }
          }

          // Fallback to a basic structure with extracted info
          extractedInfo = {
            keyMedicalTerms: medicalTerms.length > 0 ? medicalTerms : [],
            labValues: labValues.length > 0 ? labValues : [],
            diagnoses: [],
            metadata: {
              isMedicalReport: true,
              confidence: 0.6,
              missingInformation: [
                'Some structured data was extracted from image but complete JSON parsing failed',
              ],
            },
          };

          if (medicalTerms.length > 0 || labValues.length > 0) {
            this.logger.log('Extracted partial information without full JSON parsing', {
              termCount: medicalTerms.length,
              labValueCount: labValues.length,
            });
          }
        }
      } else if (this.modelId.includes('amazon.nova')) {
        // For Amazon Nova models
        this.logger.log('Parsing Nova model response', {
          responseKeys: Object.keys(parsedResponse),
        });

        // Nova output format is different - it uses a messages array in the output
        if (parsedResponse.messages && Array.isArray(parsedResponse.messages)) {
          const contentArray = parsedResponse.messages[0]?.content;
          if (contentArray && Array.isArray(contentArray)) {
            // Get the text content
            for (const content of contentArray) {
              if (content.text) {
                // Try to extract JSON from the text
                try {
                  const jsonMatch =
                    content.text.match(/```json\n([\s\S]*?)\n```/) ||
                    content.text.match(/{[\s\S]*?}/);

                  if (jsonMatch) {
                    extractedInfo = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                    this.logger.log('Successfully parsed JSON from Nova response');
                    break;
                  }
                } catch (jsonError) {
                  this.logger.warn('Failed to parse JSON from content.text', {
                    error: jsonError instanceof Error ? jsonError.message : 'Unknown error',
                    textPreview: content.text.substring(0, 200) + '...',
                  });
                }
              }
            }
          }
        } else if (parsedResponse.output && Array.isArray(parsedResponse.output)) {
          // Alternative Nova format with output array
          let novaText = '';

          // Extract text from Nova's response structure
          for (const item of parsedResponse.output) {
            if (item.type === 'text') {
              novaText += item.text;
            }
          }

          if (novaText) {
            try {
              const jsonMatch =
                novaText.match(/```json\n([\s\S]*?)\n```/) || novaText.match(/{[\s\S]*?}/);

              if (jsonMatch) {
                extractedInfo = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                this.logger.log('Successfully parsed JSON from Nova response');
              } else {
                throw new Error('No JSON found in Nova response');
              }
            } catch (jsonError) {
              this.logger.warn('Failed to parse JSON from Nova response', jsonError);

              // Fallback to a basic structure with the raw text
              extractedInfo = {
                keyMedicalTerms: [],
                labValues: [],
                diagnoses: [],
                metadata: {
                  isMedicalReport: true,
                  confidence: 0.5,
                  missingInformation: ['Could not extract structured data from image'],
                },
              };
            }
          }
        }
      }

      // Validate the extracted info has the expected structure
      if (!Array.isArray(extractedInfo.keyMedicalTerms)) {
        extractedInfo.keyMedicalTerms = [];
      }

      if (!Array.isArray(extractedInfo.labValues)) {
        extractedInfo.labValues = [];
      }

      if (!Array.isArray(extractedInfo.diagnoses)) {
        extractedInfo.diagnoses = [];
      }

      // Filter out lab values that appear to be normal range boundaries rather than actual values
      if (extractedInfo.labValues.length > 0) {
        const normalRangeBoundaries = [
          '4.2',
          '5.9',
          '4.5',
          '11',
          '13.5',
          '17.5',
          '38',
          '51',
          '150',
          '450',
          '27',
          '33',
          '32',
          '36',
          '80',
          '100',
        ];

        // Check if these are likely just range values
        const suspiciousValues = extractedInfo.labValues.filter(
          lv => lv.name === '' && lv.normalRange === '' && normalRangeBoundaries.includes(lv.value),
        );

        // If most values look like range boundaries, filter them out
        if (
          suspiciousValues.length > 3 &&
          suspiciousValues.length >= extractedInfo.labValues.length / 2
        ) {
          this.logger.warn(
            'Detected likely normal range boundaries in lab values, filtering them out',
            {
              beforeCount: extractedInfo.labValues.length,
              suspiciousCount: suspiciousValues.length,
            },
          );

          extractedInfo.labValues = extractedInfo.labValues.filter(
            lv =>
              !(
                lv.name === '' &&
                lv.normalRange === '' &&
                normalRangeBoundaries.includes(lv.value)
              ),
          );

          // If we removed everything, update metadata
          if (extractedInfo.labValues.length === 0) {
            if (!extractedInfo.metadata.missingInformation) {
              extractedInfo.metadata.missingInformation = [];
            }
            extractedInfo.metadata.missingInformation.push(
              'Removed likely incorrect lab values that appeared to be normal range boundaries',
            );
          }
        }
      }

      return extractedInfo;
    } catch (error) {
      this.logger.error('Error parsing Bedrock response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Failed to parse Bedrock response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Hash a string identifier for logging purposes
   */
  private hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier).digest('hex');
  }

  /**
   * Lists all available foundation models in AWS Bedrock
   * @returns Array of model information objects
   */
  async listAvailableModels() {
    try {
      this.logger.log('Listing available foundation models from AWS Bedrock');

      const command = new ListFoundationModelsCommand({});
      const response = await this.bedrockClient.send(command);

      if (!response.modelSummaries || response.modelSummaries.length === 0) {
        this.logger.warn(
          'No foundation models found. This may be due to permission issues with the AWS account.',
        );
        return [];
      }

      const modelCount = response.modelSummaries.length;
      this.logger.log(`Found ${modelCount} foundation models`);

      // Transform the response to a more user-friendly format
      return response.modelSummaries.map(model => ({
        modelId: model.modelId,
        modelName: model.modelName,
        providerName: model.providerName,
        inputModalities: model.inputModalities || [],
        outputModalities: model.outputModalities || [],
        customizationsSupported: model.customizationsSupported || [],
      }));
    } catch (error) {
      this.logger.error('Error listing foundation models', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Failed to list foundation models: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // When all else fails, try to extract CBC values directly from text
  private extractCbcValuesFromText(text: string): ExtractedMedicalInfo {
    const result: ExtractedMedicalInfo = {
      keyMedicalTerms: [],
      labValues: [],
      diagnoses: [],
      metadata: {
        isMedicalReport: true,
        confidence: 0.6,
        missingInformation: ['Extracted data from text when JSON parsing failed'],
      },
    };

    // Common CBC terms to look for
    const cbcTerms = [
      {
        term: 'RBC',
        definition: "Red blood cells, which carry oxygen from the lungs to the body's tissues",
      },
      {
        term: 'WBC',
        definition:
          'White blood cells, which are part of the immune system and help fight infections',
      },
      { term: 'Hemoglobin', definition: 'The protein in red blood cells that carries oxygen' },
      { term: 'Hematocrit', definition: 'The percentage of red blood cells in the blood' },
      { term: 'Platelets', definition: 'Cell fragments that help the blood clot' },
      {
        term: 'MCH',
        definition:
          'Mean corpuscular hemoglobin, the average weight of hemoglobin in a red blood cell',
      },
      {
        term: 'MCHC',
        definition:
          'Mean corpuscular hemoglobin concentration, a measure of the concentration of hemoglobin in red blood cells',
      },
      { term: 'MCV', definition: 'Mean corpuscular volume, the average size of red blood cells' },
    ];

    // Add terms that appear in the text
    for (const term of cbcTerms) {
      if (text.includes(term.term)) {
        result.keyMedicalTerms.push(term);
      }
    }

    // Try to extract lab values using patterns commonly found in CBC reports
    const labValuePatterns = [
      // Format: Term: Value Unit (Range)
      /\b(RBC|WBC|Hemoglobin|Hematocrit|Platelets|MCH|MCHC|MCV)\s*[:]\s*(\d+\.?\d*)\s*([a-zA-Z/%]+)?\s*(?:\(([^)]+)\))?/gi,
      // Format: Term Value Unit Range
      /\b(RBC|WBC|Hemoglobin|Hematocrit|Platelets|MCH|MCHC|MCV)\s+(\d+\.?\d*)\s*([a-zA-Z/%]+)?\s*([0-9.-]+\s*(?:to|-)\s*[0-9.-]+\s*[a-zA-Z/%]+)?/gi,
    ];

    for (const pattern of labValuePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of Array.from(matches)) {
        if (match[1] && match[2]) {
          const name = match[1].trim();
          const value = match[2].trim();
          const unit = match[3] ? match[3].trim() : '';
          const normalRange = match[4] ? match[4].trim() : '';

          // Check if this value is already in the results
          const existingIndex = result.labValues.findIndex(
            lv => lv.name.toLowerCase() === name.toLowerCase(),
          );

          if (existingIndex === -1) {
            // Add new value
            result.labValues.push({
              name,
              value,
              unit,
              normalRange,
              isAbnormal: false, // Default to not abnormal
            });
          }
        }
      }
    }

    return result;
  }
}
