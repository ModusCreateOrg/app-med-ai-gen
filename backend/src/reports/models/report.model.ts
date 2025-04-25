import { ApiProperty } from '@nestjs/swagger';

export enum ReportStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export enum ProcessingStatus {
  PROCESSED = 'processed',
  UNPROCESSED = 'unprocessed',
  IN_PROGRESS = 'in_progress',
  FAILED = 'failed',
}

export class Report {
  @ApiProperty({ description: 'Unique identifier for the report' })
  id: string;

  @ApiProperty({ description: 'User ID of the report owner' })
  userId: string;

  @ApiProperty({ description: 'Title of the report' })
  title: string;

  @ApiProperty({ description: 'Whether the report is bookmarked' })
  bookmarked: boolean;

  @ApiProperty({ description: 'Category of the report' })
  category: string;

  @ApiProperty({
    description: 'Processing status of the report',
    enum: ProcessingStatus,
    default: ProcessingStatus.UNPROCESSED,
  })
  processingStatus: ProcessingStatus;

  @ApiProperty({ description: 'Optional flag to indicate if the report is a medical report' })
  isMedicalReport?: boolean;

  @ApiProperty({ description: 'List of lab values' })
  labValues: Array<{
    name: string;
    value: string;
    unit: string;
    normalRange: string;
    status: 'normal' | 'high' | 'low';
    isCritical: boolean;
    conclusion: string;
    suggestions: string;
  }>;

  @ApiProperty({ description: 'Summary of the report' })
  summary: string;

  @ApiProperty({ description: 'Confidence score of the analysis (0-100)' })
  confidence: number;

  @ApiProperty({
    description: 'Status of the report',
    enum: ReportStatus,
    default: ReportStatus.UNREAD,
  })
  status: ReportStatus;

  @ApiProperty({ description: 'File path of the report' })
  filePath: string;

  @ApiProperty({ description: 'Original filename of the uploaded file' })
  originalFilename: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;

  @ApiProperty({ description: 'Optional error message for the report' })
  errorMessage?: string;
}
