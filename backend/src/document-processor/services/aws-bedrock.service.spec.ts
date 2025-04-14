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
                    title: 'Blood Test Results',
                    category: 'general',
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

  // Define sample text and mock analysis result
  const sampleText = `
    BLOOD TEST RESULTS
    Patient: John Doe
    Date: 2023-01-15
    
    Red Blood Cells (RBC): 5.1 x10^6/µL (Normal: 4.5-5.9)
    White Blood Cells (WBC): 7.2 x10^3/µL (Normal: 4.5-11.0)
    Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)
  `;

  const mockMedicalAnalysis: MedicalDocumentAnalysis = {
    title: 'Blood Test Results',
    category: 'general',
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
  };

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
      // Create mock response
      const mockResponse = {
        body: Buffer.from(
          JSON.stringify({
            content: [
              {
                text: JSON.stringify(mockMedicalAnalysis),
              },
            ],
          }),
        ),
      };

      // Mock the invokeBedrock method instead of directly setting the client
      vi.spyOn(service as any, 'invokeBedrock').mockResolvedValue(mockResponse);

      // Call service with user ID
      const mockUserId = 'test-user-123';
      const result = await service.analyzeMedicalDocument(sampleText, mockUserId);

      // Verify results
      expect(result).toEqual(mockMedicalAnalysis);

      // Verify the invokeBedrock was called with the correct prompt
      expect(service['invokeBedrock']).toHaveBeenCalled();
      const prompt = (service['invokeBedrock'] as any).mock.calls[0][0];
      expect(prompt).toContain('Please analyze this medical document carefully');
    });

    it('should correctly format the request for Claude models', async () => {
      // Create mock response
      const mockResponse = {
        body: Buffer.from(
          JSON.stringify({
            content: [{ text: JSON.stringify(mockMedicalAnalysis) }],
          }),
        ),
      };

      // Mock the invokeBedrock method
      vi.spyOn(service as any, 'invokeBedrock').mockResolvedValue(mockResponse);

      // Call service with user ID
      const mockUserId = 'test-user-123';
      await service.analyzeMedicalDocument(sampleText, mockUserId);

      // Verify the invokeBedrock was called with the correct prompt
      expect(service['invokeBedrock']).toHaveBeenCalled();
      const prompt = (service['invokeBedrock'] as any).mock.calls[0][0];
      expect(prompt).toContain('Please analyze this medical document carefully');
    });

    it('should throw an error for invalid input', async () => {
      const invalidDocument = '';

      // Call with user ID
      const mockUserId = 'test-user-123';
      await expect(service.analyzeMedicalDocument(invalidDocument, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for empty response', async () => {
      // Create mock response with empty content
      const mockResponse = {
        body: Buffer.from(
          JSON.stringify({
            content: [],
          }),
        ),
      };

      // Mock the invokeBedrock method
      vi.spyOn(service as any, 'invokeBedrock').mockResolvedValue(mockResponse);

      const emptyResponseText = 'This will trigger an empty response';

      // Call with user ID
      const mockUserId = 'test-user-123';
      await expect(service.analyzeMedicalDocument(emptyResponseText, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle rate limiting', async () => {
      // Mock rate limiter to reject the request
      service['rateLimiter'].tryRequest = vi.fn().mockReturnValue(false);

      // Call with user ID
      const mockUserId = 'test-user-123';
      await expect(service.analyzeMedicalDocument(sampleText, mockUserId)).rejects.toThrow(
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
        title: 'Test Report',
        category: 'general',
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
