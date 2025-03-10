export enum ReportStatus {
  READ = 'READ',
  UNREAD = 'UNREAD',
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportDto {
  title: string;
  content: string;
}

export type UpdateReportDto = Partial<Omit<Report, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface GetLatestReportsQuery {
  limit?: number;
}
