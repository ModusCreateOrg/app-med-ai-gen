import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    description: 'The URL of the file stored in S3',
    example: 'https://my-bucket.s3.amazonaws.com/reports/file-123456.pdf',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  fileUrl: string;

  @ApiProperty({
    description: 'Original filename of the uploaded file',
    example: 'medical-report-2023.pdf',
  })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  @IsNotEmpty()
  @IsString()
  fileType: string;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 1024567,
  })
  @IsNotEmpty()
  fileSize: number;

  @ApiProperty({
    description: 'Optional description of the report',
    example: 'Annual checkup results',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
