import { Controller, Get, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { AwsBedrockService } from '../../services/aws-bedrock.service';

@Controller('api/test-bedrock')
export class BedrockTestController {
  private readonly logger = new Logger(BedrockTestController.name);

  constructor(private readonly awsBedrockService: AwsBedrockService) {}

  @Get('list-models')
  @HttpCode(HttpStatus.OK)
  async listModels(): Promise<any> {
    try {
      this.logger.log('Requesting available Bedrock models');

      // Get the list of models from the AWS Bedrock service
      const models = await this.awsBedrockService.listAvailableModels();

      // Get current model information directly from the service instance
      const currentModel = {
        modelId: this.awsBedrockService['modelId'], // Access the modelId property
        inferenceProfileArn: this.awsBedrockService['inferenceProfileArn'], // Access the inferenceProfileArn property if it exists
      };

      return {
        status: 'success',
        currentModel,
        models,
      };
    } catch (error: unknown) {
      this.logger.error('Error listing Bedrock models', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new BadRequestException(
        `Failed to list Bedrock models: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async checkHealth(): Promise<any> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'aws-bedrock',
    };
  }
}
