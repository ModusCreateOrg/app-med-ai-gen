/**
 * Possible categories for medical reports.
 */
export enum ReportCategory {
  GENERAL = 'general',
  BRAIN = 'brain',
  HEART = 'heart',
}

/**
 * Status of a medical report.
 */
export enum ReportStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

/**
 * Processing status of a medical report.
 */
export enum ProcessingStatus {
  PROCESSED = 'processed',
  UNPROCESSED = 'unprocessed',
  IN_PROGRESS = 'in_progress',
  FAILED = 'failed',
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
  processingStatus: ProcessingStatus;
  labValues: LabValue[];
  summary: string;
  confidence: number;
  status: ReportStatus;
  filePath: string;
  originalFilename: string;
  fileSize: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  debugMessage?: string; // Optional debug message for the report
}
