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

export type CreateReportDto = Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'userId'>;

export type UpdateReportDto = Partial<Omit<Report, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export interface GetLatestReportsQuery {
  limit?: number;
}
