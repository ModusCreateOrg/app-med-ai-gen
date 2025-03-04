import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * DTO for explaining medical text
 */
export class ExplainMedicalTextDto {
  @IsString()
  @IsNotEmpty()
  medicalText: string;
}

/**
 * DTO for custom chat completion requests
 */
export class ChatCompletionDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  messages: { role: string; content: string }[];

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  temperature?: number;
}

/**
 * DTO for the response from the Perplexity API
 */
export class PerplexityResponseDto {
  @IsString()
  explanation: string;
}
