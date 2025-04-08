export enum ReportStatus {
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
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}
