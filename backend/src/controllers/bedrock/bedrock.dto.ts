import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

/**
 * DTO for uploading medical images
 */
export class UploadMedicalImageDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  filename?: string;

  /**
   * Base64 encoded image content
   */
  @IsString()
  @IsNotEmpty()
  base64Image: string;

  /**
   * Image MIME type
   */
  @IsString()
  @IsNotEmpty()
  @IsEnum(['image/jpeg', 'image/png', 'image/heic', 'image/heif'])
  contentType: string;
}

/**
 * Response DTO for extracted medical information
 */
export class ExtractedMedicalInfoResponseDto {
  keyMedicalTerms: Array<{
    term: string;
    definition: string;
  }>;

  labValues: Array<{
    name: string;
    value: string;
    unit: string;
    normalRange?: string;
    isAbnormal?: boolean;
  }>;

  diagnoses: Array<{
    condition: string;
    details: string;
    recommendations?: string;
  }>;

  metadata: {
    isMedicalReport: boolean;
    confidence: number;
    missingInformation: string[];
  };
}
