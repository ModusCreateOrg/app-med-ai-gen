import { ReportStatus } from '../models/report.model';

export class ReportResponseDto {
  id: string;
  title: string;
  content: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export class PaginatedReportsResponseDto {
  items: ReportResponseDto[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}
