export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export interface Report {
  id: string;
  userId: string;
  fileName?: string;
  filePath?: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}
