import axios, { AxiosRequestConfig } from 'axios';
import { MedicalReport, ReportStatus } from '../models/medicalReport';
import { fetchAuthSession } from '@aws-amplify/auth';
// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_BASE_URL_API || '';

/**
 * Creates an authenticated request config with bearer token
 */
const getAuthConfig = async (): Promise<AxiosRequestConfig> => {
  const session = await fetchAuthSession();
  return {
    headers: {
      Authorization: session.tokens?.idToken ? `Bearer ${session.tokens.idToken.toString()}` : ''
    }
  };
};

/**
 * Error thrown when report operations fail.
 */
export class ReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportError';
  }
}

/**
 * Interface for upload progress callback
 */
export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Uploads a medical report file
 * @param file - The file to upload
 * @param onProgress - Optional callback for tracking upload progress
 * @returns Promise with the created medical report
 */
export const uploadReport = async (
  file: File,
  description?: string,
  onProgress?: (progress: number) => void
): Promise<MedicalReport> => {
  const formData = new FormData();
  formData.append('file', file);

  if (description) {
    formData.append('description', description);
  }

  const response = await axios.post<MedicalReport>(`${API_URL}/api/reports/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

/**
 * Fetches the latest reports (limited to a specified count).
 * @param limit - Maximum number of reports to fetch
 * @returns Promise with the latest reports
 */
export const fetchLatestReports = async (limit = 3): Promise<MedicalReport[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/reports/latest?limit=${limit}`, await getAuthConfig());
    console.log('response', response.data);
    console.log('API_URL', API_URL);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ReportError(`Failed to fetch latest reports: ${error.message}`);
    }
    throw new ReportError('Failed to fetch latest reports');
  }
};

/**
 * Fetches all reports.
 * @returns Promise with all reports
 */
export const fetchAllReports = async (): Promise<MedicalReport[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/reports`, await getAuthConfig() );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ReportError(`Failed to fetch all reports: ${error.message}`);
    }
    throw new ReportError('Failed to fetch all reports');
  }
};

/**
 * Marks a report as read.
 * @param reportId - ID of the report to mark as read
 * @returns Promise with the updated report
 */
export const markReportAsRead = async (reportId: string): Promise<MedicalReport> => {
  try {
    const response = await axios.patch(`${API_URL}/api/reports/${reportId}`, {
      status: ReportStatus.READ
    });

    const report = response.data;

    if (!report) {
      throw new Error(`Report with ID ${reportId} not found`);
    }

    report.status = ReportStatus.READ;
    return { ...report };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ReportError(`Failed to mark report as read: ${error.message}`);
    }
    throw new ReportError('Failed to mark report as read');
  }
};
