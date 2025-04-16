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
  READ = 'READ',
  UNREAD = 'UNREAD'
}

/**
 * Interface for report lab values.
 */
export interface LabValue {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low';
  isCritical: boolean;
  conclusion: string;
  suggestions: string;
}

/**
 * Interface representing a medical report.
 */
export interface MedicalReport {
  id: string;
  userId: string;
  title: string;
  category: ReportCategory | string;
  bookmarked: boolean;
  isProcessed: boolean;
  labValues: LabValue[];
  summary: string;
  status: ReportStatus;
  filePath: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
