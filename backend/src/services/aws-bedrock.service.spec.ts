import { ConfigService } from '@nestjs/config';
import { AwsBedrockService, MedicalDocumentAnalysis } from './aws-bedrock.service';
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { BadRequestException } from '@nestjs/common';

// Mock the Logger
vi.mock('@nestjs/common', async () => {
  const actual = (await vi.importActual('@nestjs/common')) as Record<string, any>;
  return {
    ...actual,
    Logger: vi.fn().mockImplementation(() => ({
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn(),
    })),
  };
});

// Mock AWS SDK Bedrock client
vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: vi.fn().mockImplementation(() => ({
      send: vi.fn().mockImplementation(command => {
        // Get the prompt from the command body
        const body = JSON.parse(command.input.body);
        const prompt = body.messages[0].content[0].text;

        // Basic mock response structure with required properties
        const createMockResponse = (bodyContent: any) => ({
          body: new TextEncoder().encode(JSON.stringify(bodyContent)),
          contentType: 'application/json',
          $metadata: {
            httpStatusCode: 200,
            requestId: 'mock-request-id',
            attempts: 1,
            totalRetryDelay: 0,
          },
        });

        // Return different mock responses based on the prompt content
        if (prompt.includes('invalid document')) {
          return Promise.resolve(
            createMockResponse({
              content: [
                {
                  type: 'text',
                  text: 'This is not valid JSON',
                },
              ],
            }),
          );
        } else if (prompt.includes('empty response')) {
          return Promise.resolve(
            createMockResponse({
              content: [],
            }),
          );
        } else if (prompt.includes('BLOOD TEST RESULTS')) {
          // Only return success response for actual medical document text
          return Promise.resolve(
            createMockResponse({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    keyMedicalTerms: [
                      { term: 'RBC', definition: 'Red Blood Cells' },
                      { term: 'WBC', definition: 'White Blood Cells' },
                    ],
                    labValues: [
                      {
                        name: 'Hemoglobin',
                        value: '14.2',
                        unit: 'g/dL',
                        normalRange: '13.5-17.5',
                        isAbnormal: false,
                      },
                    ],
                    diagnoses: [],
                    metadata: {
                      isMedicalReport: true,
                      confidence: 0.95,
                      missingInformation: [],
                    },
                  }),
                },
              ],
            }),
          );
        } else {
          return Promise.resolve(
            createMockResponse({
              content: [
                {
                  type: 'text',
                  text: 'Default response',
                },
              ],
            }),
          );
        }
      }),
    })),
    InvokeModelCommand: vi.fn().mockImplementation(params => ({
      input: params,
    })),
  };
});

describe('AwsBedrockService', () => {
  let service: AwsBedrockService;
  let mockConfigService: ConfigService;
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock ConfigService
    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        const config: Record<string, any> = {
          'aws.region': 'us-east-1',
          'aws.aws.accessKeyId': 'test-access-key',
          'aws.aws.secretAccessKey': 'test-secret-key',
          'aws.bedrock.model': 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
          'aws.bedrock.maxTokens': 2048,
        };
        return config[key];
      }),
    } as unknown as ConfigService;

    // Create service instance
    service = new AwsBedrockService(mockConfigService);
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with test environment values', () => {
      expect(service['modelId']).toBe('us.anthropic.claude-3-7-sonnet-20250219-v1:0');
      expect(service['defaultMaxTokens']).toBe(1000);
    });
  });

  describe('analyzeMedicalDocument', () => {
    it('should successfully analyze a valid medical document', async () => {
      // Create a sample medical document text
      const sampleText = `
        BLOOD TEST RESULTS
        Patient: John Doe
        Date: 2023-01-15
        
        Red Blood Cells (RBC): 5.1 x10^6/µL (Normal: 4.5-5.9)
        White Blood Cells (WBC): 7.2 x10^3/µL (Normal: 4.5-11.0)
        Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)
      `;

      // Call the method
      const result = await service.analyzeMedicalDocument(sampleText);

      // Assert the result
      expect(result).toBeDefined();
      expect(result.keyMedicalTerms).toHaveLength(2);
      expect(result.keyMedicalTerms[0].term).toBe('RBC');
      expect(result.keyMedicalTerms[0].definition).toBe('Red Blood Cells');

      expect(result.labValues).toHaveLength(1);
      expect(result.labValues[0].name).toBe('Hemoglobin');
      expect(result.labValues[0].value).toBe('14.2');
      expect(result.labValues[0].unit).toBe('g/dL');
      expect(result.labValues[0].isAbnormal).toBe(false);

      expect(result.metadata.isMedicalReport).toBe(true);
      expect(result.metadata.confidence).toBeGreaterThan(0.9);
    });

    it('should correctly format the prompt for medical document analysis', async () => {
      // Spy on the invokeBedrock method
      const invokeBedrockSpy = vi.spyOn(service as any, 'invokeBedrock');

      // Sample document text
      const sampleText = 'Sample medical document';

      try {
        await service.analyzeMedicalDocument(sampleText);
      } catch (error) {
        // We don't care about the result, just the prompt format
      }

      // Verify invokeBedrock was called
      expect(invokeBedrockSpy).toHaveBeenCalled();

      // Verify the prompt format
      const prompt = invokeBedrockSpy.mock.calls[0][0] as string;

      // Check key elements of the prompt
      expect(prompt).toContain('Please analyze this medical document carefully');
      expect(prompt).toContain('Format the response as a JSON object');
      expect(prompt).toContain('keyMedicalTerms');
      expect(prompt).toContain('labValues');
      expect(prompt).toContain('diagnoses');
      expect(prompt).toContain('metadata');
      expect(prompt).toContain('Sample medical document'); // Document text is appended
    });

    it('should throw BadRequestException for invalid JSON response', async () => {
      // Create a sample invalid document text
      const invalidDocument = 'This is an invalid document that will cause an invalid response';

      // Expect the method to throw BadRequestException
      await expect(service.analyzeMedicalDocument(invalidDocument)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for empty response', async () => {
      // Create a sample text that will trigger an empty response
      const emptyResponseText = 'This will trigger an empty response';

      // Expect the method to throw BadRequestException
      await expect(service.analyzeMedicalDocument(emptyResponseText)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle rate limiting correctly', async () => {
      // Mock the rate limiter to reject requests
      service['rateLimiter'].tryRequest = vi.fn().mockReturnValue(false);

      // Create a sample medical document text
      const sampleText = 'Sample medical document text';

      // Expect the method to throw BadRequestException due to rate limiting
      await expect(service.analyzeMedicalDocument(sampleText)).rejects.toThrow(
        'Rate limit exceeded',
      );
    });

    it('should validate response structure correctly', () => {
      // Create invalid response objects to test validation
      const invalidResponses = [
        null,
        {},
        { keyMedicalTerms: 'not an array' },
        { keyMedicalTerms: [], labValues: [], diagnoses: [] }, // Missing metadata
        {
          keyMedicalTerms: [],
          labValues: [],
          diagnoses: [],
          metadata: { isMedicalReport: 'not a boolean', confidence: 0.5, missingInformation: [] },
        },
      ];

      // Test each invalid response
      invalidResponses.forEach(response => {
        expect(() => service['validateMedicalAnalysisResponse'](response)).toThrow(
          BadRequestException,
        );
      });

      // Test a valid response
      const validResponse: MedicalDocumentAnalysis = {
        keyMedicalTerms: [],
        labValues: [],
        diagnoses: [],
        metadata: {
          isMedicalReport: true,
          confidence: 0.9,
          missingInformation: [],
        },
      };

      // Should not throw for valid response
      expect(() => service['validateMedicalAnalysisResponse'](validResponse)).not.toThrow();
    });
  });
});
