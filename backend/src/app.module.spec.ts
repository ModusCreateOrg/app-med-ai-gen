import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ReportsService } from './reports/reports.service';
import { vi, describe, it, expect } from 'vitest';
import configuration from './config/configuration';
import { PerplexityService } from './services/perplexity.service';
import { AwsSecretsService } from './services/aws-secrets.service';
import { AwsTextractService } from './document-processor/services/aws-textract.service';
import { AwsBedrockService } from './document-processor/services/aws-bedrock.service';

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
      .overrideProvider(PerplexityService)
      .useValue({
        askQuestion: vi.fn().mockResolvedValue({}),
      })
      .overrideProvider(AwsSecretsService)
      .useValue({
        getPerplexityApiKey: vi.fn().mockResolvedValue('test-api-key'),
      })
      .overrideProvider(AwsTextractService)
      .useValue({
        extractText: vi.fn().mockResolvedValue({}),
        processBatch: vi.fn().mockResolvedValue([]),
      })
      .overrideProvider(AwsBedrockService)
      .useValue({
        generateResponse: vi.fn().mockResolvedValue('test response'),
        analyzeMedicalDocument: vi.fn().mockResolvedValue({
          keyMedicalTerms: [],
          labValues: [],
          diagnoses: [],
          metadata: {
            isMedicalReport: true,
            confidence: 0.9,
            missingInformation: [],
          },
        }),
      })
      .compile();

    expect(module).toBeDefined();
  });
});
