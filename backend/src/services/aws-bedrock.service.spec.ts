import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AwsBedrockService } from './aws-bedrock.service';
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';

// Mock validateFileSecurely to bypass file validation in tests
vi.mock('../utils/security.utils', () => {
  return {
    validateFileSecurely: vi.fn().mockImplementation((buffer, fileType) => {
      if (!['image/jpeg', 'image/png', 'image/heic', 'image/heif'].includes(fileType)) {
        throw new BadRequestException('Only JPEG, PNG, and HEIC/HEIF images are allowed');
      }
    }),
    sanitizeMedicalData: vi.fn(data => data),
    RateLimiter: vi.fn().mockImplementation(() => ({
      tryRequest: vi.fn().mockReturnValue(true),
    })),
  };
});

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
    
    // Mock private methods directly
    vi.spyOn(service as any, 'invokeBedrock').mockImplementation(() => Promise.resolve({
      body: Buffer.from('{"mock": "response"}'),
    }));
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

  describe('extractMedicalInfo', () => {
    const mockImageBuffer = Buffer.from('test image content');

    it('should successfully extract medical information from image/jpeg', async () => {
      const mockMedicalInfo = {
        keyMedicalTerms: [
          { term: 'Hemoglobin', definition: 'Protein in red blood cells that carries oxygen' },
        ],
        labValues: [
          { name: 'Hemoglobin', value: '14.5', unit: 'g/dL', normalRange: '12.0-15.5', isAbnormal: false },
        ],
        diagnoses: [
          { condition: 'Normal Blood Count', details: 'All values within normal range', recommendations: 'Continue monitoring' },
        ],
        metadata: {
          isMedicalReport: true,
          confidence: 0.95,
          missingInformation: [],
        },
      };

      // Mock parseBedrockResponse method to return our expected data
      vi.spyOn(service as any, 'parseBedrockResponse').mockReturnValueOnce(mockMedicalInfo);

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/jpeg');

      expect(result).toHaveProperty('keyMedicalTerms');
      expect(result.keyMedicalTerms[0].term).toBe('Hemoglobin');
      expect(result.metadata.isMedicalReport).toBe(true);
    });

    it('should successfully extract medical information from image/png', async () => {
      const mockMedicalInfo = {
        keyMedicalTerms: [
          { term: 'Glucose', definition: 'Blood sugar level' },
        ],
        labValues: [
          { name: 'Glucose', value: '90', unit: 'mg/dL', normalRange: '70-100', isAbnormal: false },
        ],
        diagnoses: [
          { condition: 'Normal Glucose', details: 'Normal blood sugar', recommendations: 'Continue healthy diet' },
        ],
        metadata: {
          isMedicalReport: true,
          confidence: 0.92,
          missingInformation: [],
        },
      };

      // Mock parseBedrockResponse method to return our expected data
      vi.spyOn(service as any, 'parseBedrockResponse').mockReturnValueOnce(mockMedicalInfo);

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/png');

      expect(result).toHaveProperty('keyMedicalTerms');
      expect(result.keyMedicalTerms[0].term).toBe('Glucose');
      expect(result.metadata.isMedicalReport).toBe(true);
    });

    it('should successfully extract medical information from image/heic', async () => {
      const mockMedicalInfo = {
        keyMedicalTerms: [
          { term: 'Cholesterol', definition: 'Lipid molecule found in cell membranes' },
        ],
        labValues: [
          { name: 'Cholesterol', value: '180', unit: 'mg/dL', normalRange: '< 200', isAbnormal: false },
        ],
        diagnoses: [
          { condition: 'Normal Cholesterol', details: 'Within healthy range', recommendations: 'Continue heart-healthy diet' },
        ],
        metadata: {
          isMedicalReport: true,
          confidence: 0.90,
          missingInformation: [],
        },
      };

      // Mock parseBedrockResponse method to return our expected data
      vi.spyOn(service as any, 'parseBedrockResponse').mockReturnValueOnce(mockMedicalInfo);

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/heic');

      expect(result).toHaveProperty('keyMedicalTerms');
      expect(result.keyMedicalTerms[0].term).toBe('Cholesterol');
      expect(result.metadata.isMedicalReport).toBe(true);
    });

    it('should successfully extract medical information from image/heif', async () => {
      const mockMedicalInfo = {
        keyMedicalTerms: [
          { term: 'Triglycerides', definition: 'Type of fat found in blood' },
        ],
        labValues: [
          { name: 'Triglycerides', value: '120', unit: 'mg/dL', normalRange: '< 150', isAbnormal: false },
        ],
        diagnoses: [
          { condition: 'Normal Triglycerides', details: 'Within healthy range', recommendations: 'Continue heart-healthy diet' },
        ],
        metadata: {
          isMedicalReport: true,
          confidence: 0.88,
          missingInformation: [],
        },
      };

      // Mock parseBedrockResponse method to return our expected data
      vi.spyOn(service as any, 'parseBedrockResponse').mockReturnValueOnce(mockMedicalInfo);

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/heif');

      expect(result).toHaveProperty('keyMedicalTerms');
      expect(result.keyMedicalTerms[0].term).toBe('Triglycerides');
      expect(result.metadata.isMedicalReport).toBe(true);
    });

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

      // Mock parseBedrockResponse method to return our expected data
      vi.spyOn(service as any, 'parseBedrockResponse').mockReturnValueOnce(nonMedicalInfo);

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/jpeg');
      expect(result.metadata.isMedicalReport).toBe(false);
      expect(result.metadata.missingInformation).toContain('The image was not clearly identified as a medical document. Results may be limited.');
    });

    it('should handle low quality or unclear images', async () => {
      const lowQualityInfo = {
        keyMedicalTerms: [],
        labValues: [],
        diagnoses: [],
        metadata: {
          isMedicalReport: true,
          confidence: 0.3,
          missingInformation: ['Image too blurry', 'Text not readable'],
        },
      };

      // Mock parseBedrockResponse method to return our expected data
      vi.spyOn(service as any, 'parseBedrockResponse').mockReturnValueOnce(lowQualityInfo);

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/jpeg');
      expect(result.metadata.confidence).toBeLessThan(0.5);
      expect(result.metadata.missingInformation).toContain('Low confidence in the analysis. Please verify results or try a clearer image.');
    });

    it('should handle partially visible information in images', async () => {
      const partialInfo = {
        keyMedicalTerms: [{ term: 'Partial term', definition: 'Only partially visible' }],
        labValues: [],
        diagnoses: [],
        metadata: {
          isMedicalReport: true,
          confidence: 0.7,
          missingInformation: ['Partial document visible', 'Some values not readable'],
        },
      };

      // Mock parseBedrockResponse method to return our expected data
      vi.spyOn(service as any, 'parseBedrockResponse').mockReturnValueOnce(partialInfo);

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/jpeg');
      
      expect(result.metadata.missingInformation).toContain('Partial document visible');
      expect(result.keyMedicalTerms[0].term).toBe('Partial term');
    });

    it('should reject unsupported file types', async () => {
      await expect(service.extractMedicalInfo(mockImageBuffer, 'image/gif')).rejects.toThrow(
        'Only JPEG, PNG, and HEIC/HEIF images are allowed'
      );
    });

    it('should accept JPEG images with EXIF data from mobile phones', async () => {
      const mockMedicalInfo = {
        keyMedicalTerms: [
          { term: 'BUN', definition: 'Blood Urea Nitrogen - kidney function test' },
        ],
        labValues: [
          { name: 'BUN', value: '15', unit: 'mg/dL', normalRange: '7-20', isAbnormal: false },
        ],
        diagnoses: [
          { condition: 'Normal Kidney Function', details: 'BUN within normal limits', recommendations: 'Routine follow-up' },
        ],
        metadata: {
          isMedicalReport: true,
          confidence: 0.95,
          missingInformation: [],
        },
      };

      // Mock parseBedrockResponse method to return our expected data
      vi.spyOn(service as any, 'parseBedrockResponse').mockReturnValueOnce(mockMedicalInfo);

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/jpeg');

      expect(result).toHaveProperty('keyMedicalTerms');
      expect(result.keyMedicalTerms[0].term).toBe('BUN');
      expect(result.metadata.isMedicalReport).toBe(true);
    });

    it('should accept HEIC/HEIF images from mobile phones', async () => {
      const mockMedicalInfo = {
        keyMedicalTerms: [
          { term: 'Creatinine', definition: 'Waste product filtered by kidneys' },
        ],
        labValues: [
          { name: 'Creatinine', value: '0.9', unit: 'mg/dL', normalRange: '0.7-1.3', isAbnormal: false },
        ],
        diagnoses: [
          { condition: 'Normal Kidney Function', details: 'Creatinine within normal limits', recommendations: 'Routine follow-up' },
        ],
        metadata: {
          isMedicalReport: true,
          confidence: 0.93,
          missingInformation: [],
        },
      };

      // Mock parseBedrockResponse method to return our expected data
      vi.spyOn(service as any, 'parseBedrockResponse').mockReturnValueOnce(mockMedicalInfo);

      const result = await service.extractMedicalInfo(mockImageBuffer, 'image/heic');

      expect(result).toHaveProperty('keyMedicalTerms');
      expect(result.keyMedicalTerms[0].term).toBe('Creatinine');
      expect(result.metadata.isMedicalReport).toBe(true);
    });

    it('should handle errors when image processing fails', async () => {
      const error = new Error('Image processing failed');
      vi.spyOn(service as any, 'invokeBedrock').mockRejectedValueOnce(error);

      await expect(service.extractMedicalInfo(mockImageBuffer, 'image/jpeg')).rejects.toThrow(
        /Failed to extract medical information from image: Image processing failed/
      );
    });

    it('should handle invalid response format', async () => {
      vi.spyOn(service as any, 'parseBedrockResponse').mockImplementationOnce(() => {
        throw new Error('Invalid response format');
      });

      await expect(service.extractMedicalInfo(mockImageBuffer, 'image/jpeg')).rejects.toThrow(
        /Failed to extract medical information from image: Invalid response format/
      );
    });
  });
});
