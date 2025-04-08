import { Module } from '@nestjs/common';
import { DocumentProcessorService } from './services/document-processor.service';
import { ConfigModule } from '@nestjs/config';
import { AwsTextractService } from './services/aws-textract.service';
import { AwsBedrockService } from './services/aws-bedrock.service';
import { DocumentProcessorController } from './controllers/document-processor.controller';
import { PerplexityService } from '../services/perplexity.service';
import { AwsSecretsService } from '../services/aws-secrets.service';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentProcessorController],
  providers: [
    DocumentProcessorService,
    AwsTextractService,
    AwsBedrockService,
    PerplexityService,
    AwsSecretsService,
  ],
  exports: [DocumentProcessorService, AwsTextractService, AwsBedrockService],
})
export class DocumentProcessorModule {}
