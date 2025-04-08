import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Medical report file' })
  file: Express.Multer.File;
}

export class FileUploadResponseDto {
  @ApiProperty({ example: 'abc123-report.pdf', description: 'Generated file name' })
  fileName: string;

  @ApiProperty({
    example: 's3://bucket/user123/reports/abc123-report.pdf',
    description: 'File storage path',
  })
  filePath: string;

  @ApiProperty({
    example: 'https://bucket.s3.amazonaws.com/user123/reports/abc123-report.pdf',
    description: 'File URL',
  })
  fileUrl: string;

  @ApiProperty({ example: 'application/pdf', description: 'File MIME type' })
  mimeType: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  size: number;

  @ApiProperty({ example: '2023-10-25T15:30:45Z', description: 'Upload timestamp' })
  uploadedAt: string;
}
