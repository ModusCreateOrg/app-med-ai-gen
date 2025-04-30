import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PerplexityService, PerplexityMessage } from './perplexity.service';
import { AwsSecretsService } from './aws-secrets.service';
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

// Mock axios completely to prevent any real API calls
vi.mock('axios', () => {
  return {
    default: {
      post: vi.fn(),
      isAxiosError: vi.fn(),
    },
  };
});

describe('PerplexityService', () => {
  let service: PerplexityService;
  const originalEnv = process.env.NODE_ENV;

  // Create a class that implements all required methods of ConfigService
  class MockConfigService {
    private config: Record<string, any> = {
      'perplexity.apiBaseUrl': 'https://api.perplexity.ai',
      'perplexity.model': 'test-model',
      'perplexity.maxTokens': 1000,
      'aws.secretsManager.perplexityApiKeySecret': 'test-secret-name',
      'aws.region': 'us-east-1',
    };

    get<T = any>(key: string): T {
      return this.config[key] as T;
    }
  }

  // Create a class that implements all required methods of AwsSecretsService
  class MockSecretsService {
    getSecret = vi.fn().mockResolvedValue('test-api-key');
  }

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset axios mock before each test
    vi.mocked(axios.post).mockClear();
    vi.mocked(axios.isAxiosError).mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerplexityService,
        { provide: ConfigService, useClass: MockConfigService },
        { provide: AwsSecretsService, useClass: MockSecretsService },
      ],
    }).compile();

    service = module.get<PerplexityService>(PerplexityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChatCompletion', () => {
    const mockMessages: PerplexityMessage[] = [{ role: 'user', content: 'Hello' }];
    const mockResponse = {
      data: {
        id: 'test-id',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello, how can I help?' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      },
    };

    it('should call Perplexity API and return response', async () => {
      // Arrange
      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

      // Act
      const result = await service.createChatCompletion(mockMessages);

      // Assert
      // In test mode, we use a hardcoded API key so getSecret isn't called
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'test-model',
          messages: mockMessages,
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should use custom options when provided', async () => {
      // Arrange
      vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);
      const customOptions = {
        model: 'custom-model',
        maxTokens: 500,
        temperature: 0.3,
      };

      // Act
      await service.createChatCompletion(mockMessages, customOptions);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'custom-model',
          messages: mockMessages,
          max_tokens: 500,
          temperature: 0.3,
        },
        expect.any(Object),
      );
    });

    it('should throw an error when API call fails', async () => {
      // Arrange
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('API error'));
      vi.mocked(axios.isAxiosError).mockReturnValueOnce(false);

      // Act & Assert
      await expect(service.createChatCompletion(mockMessages)).rejects.toThrow(
        'Failed to create chat completion',
      );
    });

    it('should handle Axios specific errors', async () => {
      // Arrange
      const axiosError = new Error('API error') as any;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 401,
        statusText: 'Unauthorized',
        data: { error: 'Invalid API key' },
      };

      vi.mocked(axios.post).mockRejectedValueOnce(axiosError);
      vi.mocked(axios.isAxiosError).mockReturnValueOnce(true);

      // Act & Assert
      await expect(service.createChatCompletion(mockMessages)).rejects.toThrow(
        'Perplexity API error',
      );
    });
  });
});
