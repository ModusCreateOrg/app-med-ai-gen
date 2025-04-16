/**
 * Possible categories for medical reports.
 */
export enum ReportCategory {
  GENERAL = 'General',
  NEUROLOGICAL = 'Neurological',
  OFTALMOLOGICAL = 'Oftalmological',
  HEART = 'Heart',
  GASTRO = 'Gastroenterology',
  ORTHOPEDIC = 'Orthopedic',
  OTHER = 'Other'
}

/**
 * Status of a medical report.
 */
export enum ReportStatus {
  READ = 'read',
  UNREAD = 'unread'
}

/**
 * Interface representing a medical report.
 */
export interface MedicalReport {
  id: string;
  title: string;
  category: ReportCategory;
  createdAt: string; // ISO date string
  status: ReportStatus;
  documentUrl?: string;
  summary?: string;
  content?: string;
  doctor?: string;
  facility?: string;
  bookmarked?: boolean;
}
