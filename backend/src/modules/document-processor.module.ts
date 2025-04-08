import { Module } from '@nestjs/common';
import { DocumentProcessorService } from '../services/document-processor.service';
import { ConfigModule } from '@nestjs/config';
import { AwsTextractService } from '../services/aws-textract.service';
import { AwsBedrockService } from '../services/aws-bedrock.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [DocumentProcessorService, AwsTextractService, AwsBedrockService],
  exports: [DocumentProcessorService],
})
export class DocumentProcessorModule {}
