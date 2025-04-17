import { ApiProperty } from '@nestjs/swagger';

export enum ReportStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export enum ProcessingStatus {
  PROCESSED = 'processed',
  UNPROCESSED = 'unprocessed',
  IN_PROGRESS = 'in_progress',
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

  @ApiProperty({
    description: 'Status of the report',
    enum: ReportStatus,
    default: ReportStatus.UNREAD,
  })
  status: ReportStatus;

  @ApiProperty({ description: 'File path of the report' })
  filePath: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}
