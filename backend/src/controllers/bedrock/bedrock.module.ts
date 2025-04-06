import { Module } from '@nestjs/common';
import { BedrockTestController } from './bedrock.controller';
import { AwsBedrockService } from '../../services/aws-bedrock.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [BedrockTestController],
  providers: [AwsBedrockService],
})
export class BedrockTestModule {}
