import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AwsBedrockService } from './aws-bedrock.service';
import { InvokeModelCommand, InvokeModelCommandOutput } from '@aws-sdk/client-bedrock-runtime';
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';

// Mock the Logger to suppress logs during tests
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

// Mock AWS Bedrock client
vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: vi.fn().mockImplementation(() => ({
      send: vi.fn(),
    })),
    InvokeModelCommand: vi.fn(),
  };
});

describe('AwsBedrockService', () => {
  let service: AwsBedrockService;
  let mockConfigService: Partial<ConfigService>;
  let mockBedrockClient: { send: ReturnType<typeof vi.fn> };
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create mock config service
    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        const config: Record<string, any> = {
          'aws.region': 'us-east-1',
          'bedrock.model': 'anthropic.claude-v2',
          'bedrock.maxTokens': 2048,
          'aws.aws.accessKeyId': 'test-access-key',
          'aws.aws.secretAccessKey': 'test-secret-key',
        };
        return config[key];
      }),
    };

    // Create the testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsBedrockService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AwsBedrockService>(AwsBedrockService);
    mockBedrockClient = service['client'] as unknown as { send: ReturnType<typeof vi.fn> };
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with test environment values', () => {
      expect(service['defaultModel']).toBe('anthropic.claude-v2');
      expect(service['defaultMaxTokens']).toBe(1000);
    });
  });

  describe('extractMedicalInfo', () => {
    const mockFileBuffer = Buffer.from('test file content');
    const mockFileType = 'application/pdf';
    const mockResponseData = {
      content: JSON.stringify({
        keyMedicalTerms: [{ term: 'Hypertension', definition: 'High blood pressure' }],
        labValues: [
          {
            name: 'Blood Pressure',
            value: '140/90',
            unit: 'mmHg',
            normalRange: '120/80',
            isAbnormal: true,
          },
        ],
        diagnoses: [
          {
            condition: 'Hypertension',
            details: 'Elevated blood pressure',
            recommendations: 'Lifestyle changes and monitoring',
          },
        ],
      }),
    };

    const mockResponse: Partial<InvokeModelCommandOutput> = {
      body: new Uint8Array(Buffer.from(JSON.stringify(mockResponseData))),
      $metadata: {},
    };

    beforeEach(() => {
      // Mock the Bedrock client response
      mockBedrockClient.send.mockResolvedValue(mockResponse);
    });

    it('should successfully extract medical information from a file', async () => {
      const result = await service.extractMedicalInfo(mockFileBuffer, mockFileType);

      // Verify the result structure
      expect(result).toHaveProperty('keyMedicalTerms');
      expect(result).toHaveProperty('labValues');
      expect(result).toHaveProperty('diagnoses');

      // Verify the command was called with correct parameters
      expect(InvokeModelCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId: 'anthropic.claude-v2',
          contentType: 'application/json',
          accept: 'application/json',
        }),
      );

      // Verify the content of the extracted information
      expect(result.keyMedicalTerms[0].term).toBe('Hypertension');
      expect(result.labValues[0].name).toBe('Blood Pressure');
      expect(result.diagnoses[0].condition).toBe('Hypertension');
    });

    it('should handle errors when file processing fails', async () => {
      // Mock a failure
      const error = new Error('Processing failed');
      mockBedrockClient.send.mockRejectedValue(error);

      await expect(service.extractMedicalInfo(mockFileBuffer, mockFileType)).rejects.toThrow(
        'Failed to extract medical information: Processing failed',
      );
    });

    it('should handle invalid response format', async () => {
      // Mock an invalid response format
      const invalidResponse: Partial<InvokeModelCommandOutput> = {
        body: new Uint8Array(Buffer.from(JSON.stringify({ content: 'Invalid JSON' }))),
        $metadata: {},
      };
      mockBedrockClient.send.mockResolvedValue(invalidResponse);

      await expect(service.extractMedicalInfo(mockFileBuffer, mockFileType)).rejects.toThrow(
        'Failed to extract JSON from response',
      );
    });

    it('should handle different file types', async () => {
      const imageFileType = 'image/jpeg';
      await service.extractMedicalInfo(mockFileBuffer, imageFileType);

      // Verify the command was called with the correct file type
      expect(InvokeModelCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining(imageFileType),
        }),
      );
    });
  });
});
