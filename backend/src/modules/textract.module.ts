import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AwsTextractService } from '../services/aws-textract.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [AwsTextractService],
  exports: [AwsTextractService],
})
export class TextractModule {}
