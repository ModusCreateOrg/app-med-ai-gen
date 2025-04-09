import { ApiProperty } from '@nestjs/swagger';

export enum ReportStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export class Report {
  @ApiProperty({ description: 'Unique identifier for the report' })
  id: string;

  @ApiProperty({ description: 'User ID of the report owner' })
  userId: string;

  @ApiProperty({ description: 'Title of the report' })
  title: string;

  @ApiProperty({ description: 'Whether the report is bookmarked' })
  bookmark: boolean;

  @ApiProperty({ description: 'Category of the report' })
  category: string;

  @ApiProperty({ description: 'Date of the report' })
  date: string;

  @ApiProperty({ description: 'Doctor associated with the report' })
  doctor: string;

  @ApiProperty({ description: 'Facility where the report was created' })
  facility: string;

  @ApiProperty({
    description: 'Status of the report',
    enum: ReportStatus,
    default: ReportStatus.UNREAD,
  })
  status: ReportStatus;

  @ApiProperty({ description: 'File URL of the report' })
  fileUrl: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}
