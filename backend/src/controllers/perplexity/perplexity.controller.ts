import { Body, Controller, Post, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PerplexityService, PerplexityMessage } from '../../services/perplexity.service';
import { ExplainMedicalTextDto, ChatCompletionDto, PerplexityResponseDto } from './perplexity.dto';

/**
 * Controller for Perplexity API endpoints
 */
@Controller('api/perplexity')
export class PerplexityController {
  private readonly logger = new Logger(PerplexityController.name);

  constructor(private readonly perplexityService: PerplexityService) {}

  /**
   * Explains medical text in simpler terms
   *
   * @param dto The DTO containing medical text to explain
   * @returns The simplified explanation
   */
  @Post('explain')
  async explainMedicalText(@Body() dto: ExplainMedicalTextDto): Promise<PerplexityResponseDto> {
    try {
      const explanation = await this.perplexityService.explainMedicalText(dto.medicalText);
      return { explanation };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to explain medical text: ${errorMessage}`);
      throw new HttpException(
        'Failed to process medical text explanation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Creates a custom chat completion
   *
   * @param dto The DTO containing messages and options
   * @returns The content of the completion
   */
  @Post('chat/completions')
  async createChatCompletion(@Body() dto: ChatCompletionDto): Promise<PerplexityResponseDto> {
    try {
      // Convert the messages to the format expected by the service
      const messages: PerplexityMessage[] = dto.messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }));

      const response = await this.perplexityService.createChatCompletion(messages, {
        model: dto.model,
        maxTokens: dto.maxTokens,
        temperature: dto.temperature,
      });

      return { explanation: response.choices[0].message.content };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create chat completion: ${errorMessage}`);
      throw new HttpException(
        'Failed to process chat completion request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
