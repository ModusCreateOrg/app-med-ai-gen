import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ReportsService } from './reports/reports.service';
import { vi, describe, it, expect } from 'vitest';
import configuration from './config/configuration';
import { AwsBedrockService } from './services/aws-bedrock.service';
import { PerplexityService } from './services/perplexity.service';
import { AwsSecretsService } from './services/aws-secrets.service';

describe('AppModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AppModule,
      ],
    })
      .overrideProvider(ReportsService)
      .useValue({
        findAll: vi.fn().mockResolvedValue([]),
        findLatest: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue({}),
        updateStatus: vi.fn().mockResolvedValue({}),
      })
      .overrideProvider(AwsBedrockService)
      .useValue({
        extractMedicalInfo: vi.fn().mockResolvedValue({}),
      })
      .overrideProvider(PerplexityService)
      .useValue({
        askQuestion: vi.fn().mockResolvedValue({}),
      })
      .overrideProvider(AwsSecretsService)
      .useValue({
        getPerplexityApiKey: vi.fn().mockResolvedValue('test-api-key'),
      })
      .compile();

    expect(module).toBeDefined();
  });
});
