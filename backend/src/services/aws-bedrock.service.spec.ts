import { ConfigService } from '@nestjs/config';
import { AwsBedrockService } from './aws-bedrock.service';
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';

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
});
