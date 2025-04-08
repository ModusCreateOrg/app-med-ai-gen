import { ConfigService } from '@nestjs/config';
import { AwsTextractService } from './aws-textract.service';
import { BadRequestException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the security.utils module
vi.mock('../utils/security.utils', () => ({
  validateFileSecurely: vi.fn(),
  RateLimiter: vi.fn().mockImplementation(() => ({
    tryRequest: vi.fn().mockReturnValue(true),
  })),
}));

describe('AwsTextractService', () => {
  let service: AwsTextractService;
  let mockConfigService: ConfigService;

  // Create mocks
  const mockTextractSend = vi.fn();

  // Mock response data
  const mockTextractResponse = {
    Blocks: [
      {
        BlockType: 'PAGE',
        Id: 'page1',
        Confidence: 99.9,
      },
      {
        BlockType: 'LINE',
        Id: 'line1',
        Text: 'This is a test medical report',
        Confidence: 99.8,
      },
      {
        BlockType: 'LINE',
        Id: 'line2',
        Text: 'Lab Results: Hemoglobin 14.5 g/dL',
        Confidence: 98.7,
      },
      {
        BlockType: 'LINE',
        Id: 'line3',
        Text: 'Normal Range: 13.5-17.5 g/dL',
        Confidence: 97.5,
      },
      {
        BlockType: 'TABLE',
        Id: 'table1',
        Confidence: 95.0,
        Relationships: [
          {
            Type: 'CHILD',
            Ids: ['cell1', 'cell2', 'cell3', 'cell4'],
          },
        ],
      },
      {
        BlockType: 'CELL',
        Id: 'cell1',
        RowIndex: 1,
        ColumnIndex: 1,
        Confidence: 94.0,
        Relationships: [
          {
            Type: 'CHILD',
            Ids: ['word1'],
          },
        ],
      },
      {
        BlockType: 'CELL',
        Id: 'cell2',
        RowIndex: 1,
        ColumnIndex: 2,
        Confidence: 93.5,
        Relationships: [
          {
            Type: 'CHILD',
            Ids: ['word2'],
          },
        ],
      },
      {
        BlockType: 'WORD',
        Id: 'word1',
        Text: 'Test',
        Confidence: 92.0,
      },
      {
        BlockType: 'WORD',
        Id: 'word2',
        Text: 'Value',
        Confidence: 91.5,
      },
      {
        BlockType: 'KEY_VALUE_SET',
        Id: 'kv1',
        EntityTypes: ['KEY'],
        Confidence: 90.0,
        Relationships: [
          {
            Type: 'VALUE',
            Ids: ['kv2'],
          },
          {
            Type: 'CHILD',
            Ids: ['word3'],
          },
        ],
      },
      {
        BlockType: 'KEY_VALUE_SET',
        Id: 'kv2',
        EntityTypes: ['VALUE'],
        Confidence: 89.0,
        Relationships: [
          {
            Type: 'CHILD',
            Ids: ['word4'],
          },
        ],
      },
      {
        BlockType: 'WORD',
        Id: 'word3',
        Text: 'Patient',
        Confidence: 88.0,
      },
      {
        BlockType: 'WORD',
        Id: 'word4',
        Text: 'John Doe',
        Confidence: 87.5,
      },
    ],
  };

  // Setup mock dependencies
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock response
    mockTextractSend.mockResolvedValue(mockTextractResponse);

    // Create mock ConfigService
    mockConfigService = {
      get: vi.fn().mockImplementation((key: string) => {
        const config: Record<string, any> = {
          'aws.region': 'us-east-1',
          'aws.aws.accessKeyId': 'test-access-key',
          'aws.aws.secretAccessKey': 'test-secret-key',
          'aws.aws.sessionToken': 'test-session-token',
          'aws.textract.maxBatchSize': 10,
          'aws.textract.documentRequestsPerMinute': 10,
        };
        return config[key];
      }),
    } as unknown as ConfigService;

    // Create service instance
    service = new AwsTextractService(mockConfigService);

    // Replace dependencies with mocks
    (service as any).client = {
      send: mockTextractSend,
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractText', () => {
    it('should extract text from an image', async () => {
      const result = await service.extractText(
        Buffer.from('test image content'),
        'image/jpeg',
        'user-123',
      );

      expect(result).toBeDefined();
      expect(result.rawText).toContain('This is a test medical report');
      expect(result.lines.length).toBeGreaterThan(0);
      expect(result.tables.length).toBeGreaterThan(0);
      expect(result.keyValuePairs.length).toBeGreaterThan(0);
      expect(mockTextractSend).toHaveBeenCalled();
    });

    it('should extract text from a PDF', async () => {
      const result = await service.extractText(
        Buffer.from('test pdf content'),
        'application/pdf',
        'user-123',
      );

      expect(result).toBeDefined();
      expect(result.rawText).toContain('This is a test medical report');
      expect(result.lines.length).toBeGreaterThan(0);
      expect(mockTextractSend).toHaveBeenCalled();
    });

    it('should handle rate limiting by user ID', async () => {
      // Mock rate limiter to reject the request
      (service['rateLimiter'].tryRequest as any).mockReturnValueOnce(false);

      // Use a test user ID
      const userId = 'rate-limited-user';

      // Should throw rate limit exception
      await expect(
        service.extractText(Buffer.from('test content'), 'image/jpeg', userId),
      ).rejects.toThrow('Too many requests');

      // The textract API should not be called
      expect(mockTextractSend).not.toHaveBeenCalled();
    });
  });

  describe('processBatch', () => {
    it('should process a batch of documents', async () => {
      const documents = [
        {
          buffer: Buffer.from('test image 1'),
          type: 'image/jpeg',
        },
        {
          buffer: Buffer.from('test image 2'),
          type: 'image/png',
        },
      ];

      const results = await service.processBatch(documents, 'user-123');

      expect(results).toBeDefined();
      expect(results.length).toBe(2);
      expect(results[0].rawText).toContain('This is a test medical report');
      expect(results[1].rawText).toContain('This is a test medical report');
      expect(mockTextractSend).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if batch size exceeds maximum', async () => {
      const documents = Array(11).fill({
        buffer: Buffer.from('test image'),
        type: 'image/jpeg',
      });

      await expect(service.processBatch(documents, 'user-123')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockTextractSend).not.toHaveBeenCalled();
    });
  });
});
