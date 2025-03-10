import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ReportsRepository } from './reports.repository';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ReportStatus } from '../models/report.model';

// Create a mock DynamoDB client before mocking the module
const mockDocumentClient = {
  send: vi.fn(),
};

// Mock AWS SDK modules
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({
    // Empty implementation as we'll use DynamoDBDocumentClient
  })),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => mockDocumentClient),
  },
  PutCommand: vi.fn(),
  GetCommand: vi.fn(),
  QueryCommand: vi.fn(),
  UpdateCommand: vi.fn(),
  DeleteCommand: vi.fn(),
}));

describe('ReportsRepository', () => {
  let repository: ReportsRepository;
  let configService: ConfigService;

  const mockReport = {
    id: '1',
    userId: 'user1',
    title: 'Test Report',
    content: 'Test Content',
    status: ReportStatus.UNREAD,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    // Reset mock calls
    vi.clearAllMocks();

    // Create config service with mock implementation
    configService = {
      get: vi.fn((key: string) => {
        const config: Record<string, any> = {
          'aws.region': 'us-east-1',
          'aws.dynamodb.reportsTable': 'reports',
        };
        return config[key];
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsRepository,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    repository = module.get<ReportsRepository>(ReportsRepository);
  });

  describe('create', () => {
    it('should create a report', async () => {
      const createReportDto = {
        title: 'Test Report',
        content: 'Test Content',
      };

      mockDocumentClient.send.mockResolvedValueOnce({});

      const result = await repository.create('user1', createReportDto);

      expect(mockDocumentClient.send).toHaveBeenCalledWith(
        expect.any(PutCommand)
      );
      expect(result).toMatchObject({
        userId: 'user1',
        title: createReportDto.title,
        content: createReportDto.content,
        status: ReportStatus.UNREAD,
      });
    });
  });

  describe('findOne', () => {
    it('should find a report by id', async () => {
      mockDocumentClient.send.mockResolvedValueOnce({ Item: mockReport });

      const result = await repository.findOne('user1', '1');

      expect(mockDocumentClient.send).toHaveBeenCalledWith(
        expect.any(GetCommand)
      );
      expect(result).toEqual(mockReport);
    });

    it('should return null when report is not found', async () => {
      mockDocumentClient.send.mockResolvedValueOnce({ Item: null });

      const result = await repository.findOne('user1', '1');

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return paginated reports', async () => {
      const mockResponse = {
        Items: [mockReport],
        LastEvaluatedKey: { userId: 'user1', id: 'lastId' },
      };

      mockDocumentClient.send.mockResolvedValueOnce(mockResponse);

      const result = await repository.findByUser('user1', { limit: 10 });

      expect(result.items).toEqual([mockReport]);
      expect(result.nextCursor).toBeDefined();
    });

    it('should handle empty results', async () => {
      mockDocumentClient.send.mockResolvedValueOnce({ Items: [] });

      const result = await repository.findByUser('user1');

      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe('countByUser', () => {
    it('should return total count', async () => {
      mockDocumentClient.send.mockResolvedValueOnce({ Count: 5 });

      const result = await repository.countByUser('user1');

      expect(result).toBe(5);
    });
  });

  describe('update', () => {
    it('should update a report', async () => {
      const updateReportDto = { title: 'Updated Title' };
      const updatedReport = { ...mockReport, title: 'Updated Title' };

      mockDocumentClient.send.mockResolvedValueOnce({ Attributes: updatedReport });

      const result = await repository.update('user1', '1', updateReportDto);

      expect(mockDocumentClient.send).toHaveBeenCalledWith(
        expect.any(UpdateCommand)
      );
      expect(result).toEqual(updatedReport);
    });
  });

  describe('delete', () => {
    it('should delete a report', async () => {
      mockDocumentClient.send.mockResolvedValueOnce({});

      const result = await repository.delete('user1', '1');

      expect(mockDocumentClient.send).toHaveBeenCalledWith(
        expect.any(DeleteCommand)
      );
      expect(result).toBe(true);
    });

    it('should return false when delete fails', async () => {
      mockDocumentClient.send.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await repository.delete('user1', '1');

      expect(result).toBe(false);
    });
  });
});
