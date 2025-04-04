import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
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

// Mock validateFileSecurely to bypass file validation in tests
vi.mock('../utils/security.utils', () => {
  return {
    validateFileSecurely: vi.fn().mockImplementation((buffer: Buffer, fileType: string) => {
      if (!['image/jpeg', 'image/png'].includes(fileType)) {
        throw new BadRequestException('Only JPEG and PNG images are allowed');
      }
    }),
    sanitizeMedicalData: vi.fn(data => data),
    RateLimiter: vi.fn().mockImplementation(() => ({
      tryRequest: vi.fn().mockReturnValue(true),
    })),
  };
});

describe('AwsBedrockService', () => {
  let service: AwsBedrockService;
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

    // Create mock config values
    const mockConfig: Record<string, any> = {
      'aws.region': 'us-east-1',
      'aws.aws.accessKeyId': 'test-access-key',
      'aws.aws.secretAccessKey': 'test-secret-key',
      'bedrock.model': 'anthropic.claude-3-7-sonnet-20250219-v1:0',
      'bedrock.maxTokens': 2048,
    };

    // Create mock ConfigService
    const mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => mockConfig[key]),
    };

    // Create the testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AwsBedrockService,
          useFactory: () => {
            return new AwsBedrockService(mockConfigService as unknown as ConfigService);
          },
        },
      ],
    }).compile();

    // Get the service instance
    service = module.get<AwsBedrockService>(AwsBedrockService);
    mockBedrockClient = service['client'] as unknown as { send: ReturnType<typeof vi.fn> };
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with test environment values', () => {
      expect(service['defaultModel']).toBe('anthropic.claude-3-7-sonnet-20250219-v1:0');
      expect(service['defaultMaxTokens']).toBe(1000);
    });
  });

  describe('extractMedicalInfo', () => {
    const mockImageBuffer = Buffer.from('test image content');
    const mockImageTypes = ['image/jpeg', 'image/png'];
    const mockMedicalInfo = {
      keyMedicalTerms: [
        { term: 'Hemoglobin', definition: 'Protein in red blood cells that carries oxygen' },
      ],
      labValues: [
        {
          name: 'Hemoglobin',
          value: '14.5',
          unit: 'g/dL',
          normalRange: '12.0-15.5',
          isAbnormal: false,
        },
      ],
      diagnoses: [
        {
          condition: 'Normal Blood Count',
          details: 'All values within normal range',
          recommendations: 'Continue routine monitoring',
        },
      ],
      metadata: {
        isMedicalReport: true,
        confidence: 0.95,
        missingInformation: [],
      },
    };

    const mockResponseData = {
      content: `Here's the extracted medical information in JSON format:
\`\`\`json
${JSON.stringify(mockMedicalInfo, null, 2)}
\`\`\``,
    };

    const mockResponse: Partial<InvokeModelCommandOutput> = {
      $metadata: {},
      body: Buffer.from(JSON.stringify(mockResponseData)) as any,
    };

    beforeEach(() => {
      mockBedrockClient.send.mockResolvedValue(mockResponse);
    });

    it.each(mockImageTypes)(
      'should successfully extract medical information from %s',
      async imageType => {
        const result = await service.extractMedicalInfo(mockImageBuffer, imageType);

        expect(result).toHaveProperty('keyMedicalTerms');
        expect(result).toHaveProperty('labValues');
        expect(result).toHaveProperty('diagnoses');
        expect(result).toHaveProperty('metadata');

        expect(InvokeModelCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            modelId: expect.any(String),
            contentType: 'application/json',
            accept: 'application/json',
            body: expect.stringContaining(imageType),
          }),
        );

        expect(result.keyMedicalTerms[0].term).toBe('Hemoglobin');
        expect(result.labValues[0].name).toBe('Hemoglobin');
        expect(result.diagnoses[0].condition).toBe('Normal Blood Count');
        expect(result.metadata.isMedicalReport).toBe(true);
        expect(result.metadata.confidence).toBe(0.95);
      },
    );

    it('should reject non-medical images', async () => {
      const nonMedicalInfo = {
        keyMedicalTerms: [],
        labValues: [],
        diagnoses: [],
        metadata: {
          isMedicalReport: false,
          confidence: 0.1,
          missingInformation: ['Not a medical image'],
        },
      };

      const nonMedicalResponse = {
        content: `Here's the analysis:
\`\`\`json
${JSON.stringify(nonMedicalInfo, null, 2)}
\`\`\``,
      };

      mockBedrockClient.send.mockResolvedValue({
        $metadata: {},
        body: Buffer.from(JSON.stringify(nonMedicalResponse)) as any,
      });

      await expect(service.extractMedicalInfo(mockImageBuffer, 'image/jpeg')).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.extractMedicalInfo(mockImageBuffer, 'image/jpeg')).rejects.toThrow(
        'The provided image does not appear to be a medical document.',
      );
    });

    it('should handle low quality or unclear images', async () => {
      const lowQualityInfo = {
        keyMedicalTerms: [],
        labValues: [],
        diagnoses: [],
        metadata: {
          isMedicalReport: true,
          confidence: 0.5,
          missingInformation: ['Image too blurry', 'Text not readable'],
        },
      };

      const lowQualityResponse = {
        content: `Analysis results:
\`\`\`json
${JSON.stringify(lowQualityInfo, null, 2)}
\`\`\``,
      };

      mockBedrockClient.send.mockResolvedValue({
        $metadata: {},
        body: Buffer.from(JSON.stringify(lowQualityResponse)) as any,
      });

      await expect(service.extractMedicalInfo(mockImageBuffer, 'image/jpeg')).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.extractMedicalInfo(mockImageBuffer, 'image/jpeg')).rejects.toThrow(
        'Low confidence in medical image analysis',
      );
    });

    it('should handle partially visible information in images', async () => {
      const partialInfo = {
        keyMedicalTerms: [
          { term: 'Hemoglobin', definition: 'Protein in red blood cells that carries oxygen' },
        ],
        labValues: [],
        diagnoses: [],
        metadata: {
          isMedicalReport: true,
          confidence: 0.8,
          missingInformation: ['Bottom portion of image cut off', 'Some values not visible'],
        },
      };

      const partialResponse = {
        content: `Here's what I found:
\`\`\`json
${JSON.stringify(partialInfo, null, 2)}
\`\`\``,
      };

      mockBedrockClient.send.mockResolvedValue({
        $metadata: {},
        body: Buffer.from(JSON.stringify(partialResponse)) as any,
      });

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/jpeg');

      expect(result.metadata.missingInformation).toContain('Bottom portion of image cut off');
      expect(result.metadata.missingInformation).toContain('Some values not visible');
      expect(result.metadata.confidence).toBe(0.8);
    });

    it('should reject unsupported file types', async () => {
      await expect(service.extractMedicalInfo(mockImageBuffer, 'application/pdf')).rejects.toThrow(
        'Only JPEG and PNG images are allowed',
      );
    });

    it('should handle errors when image processing fails', async () => {
      const error = new Error('Image processing failed');
      mockBedrockClient.send.mockRejectedValue(error);

      await expect(service.extractMedicalInfo(mockImageBuffer, 'image/jpeg')).rejects.toThrow(
        'Failed to extract medical information from image: Image processing failed',
      );
    });

    it('should handle invalid response format', async () => {
      const invalidResponse: Partial<InvokeModelCommandOutput> = {
        $metadata: {},
        body: Buffer.from(JSON.stringify({ content: 'Invalid JSON' })) as any,
      };
      mockBedrockClient.send.mockResolvedValue(invalidResponse);

      await expect(service.extractMedicalInfo(mockImageBuffer, 'image/jpeg')).rejects.toThrow(
        'Failed to extract JSON from response',
      );
    });
  });
});
