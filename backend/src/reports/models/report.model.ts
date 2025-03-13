import { ApiProperty } from '@nestjs/swagger';

export enum ReportStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export class Report {
  @ApiProperty({ description: 'Unique identifier for the report' })
  id: string;

  @ApiProperty({ description: 'Title of the report' })
  title: string;

  @ApiProperty({ description: 'Content of the report' })
  content: string;

  @ApiProperty({ description: 'User ID of the report owner' })
  userId: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;

  @ApiProperty({
    description: 'Status of the report',
    enum: ReportStatus,
    default: ReportStatus.UNREAD,
  })
  status: ReportStatus;
}
