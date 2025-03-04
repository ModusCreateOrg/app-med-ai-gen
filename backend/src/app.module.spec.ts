import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { describe, it, expect } from 'vitest';

describe('AppModule', () => {
  it('should compile the module', async () => {
    // Create a complete mock for ConfigService
    class MockConfigService {
      private readonly config: Record<string, any> = {
        port: 3000,
        'aws.region': 'us-east-1',
        'aws.secretsManager.perplexityApiKeySecret': 'test-secret',
        'perplexity.apiBaseUrl': 'https://api.perplexity.ai',
        'perplexity.model': 'test-model',
        'perplexity.maxTokens': 1000,
      };

      get<T = any>(key: string): T {
        return this.config[key] as T;
      }
    }

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useClass(MockConfigService)
      .compile();

    expect(module).toBeDefined();
    const configService = module.get<ConfigService>(ConfigService);
    expect(configService).toBeDefined();
    expect(configService.get('port')).toBe(3000);
  });
});
