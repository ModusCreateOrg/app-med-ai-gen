import axios, { AxiosProgressEvent } from 'axios';
import { MedicalReport } from '../models/medicalReport';
import { DirectCognitoAuthService } from '../services/auth/direct-cognito-auth-service';

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_BASE_URL_API || '';

/**
 * Interface for upload progress callback
 */
export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Creates an authenticated request config with bearer token
 */
export const getAuthConfig = async (
  signal?: AbortSignal,
): Promise<{
  headers: { Accept: string; 'Content-Type': string; Authorization: string };
  signal?: AbortSignal;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}> => {
  // Get tokens from DirectCognitoAuthService
  const tokens = DirectCognitoAuthService.getTokens();
  const idToken = tokens?.id_token || '';

  return {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: idToken ? `Bearer ${idToken}` : '',
    },
    signal,
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
 * Uploads a medical report file
 * @param file - The file to upload
 * @param onProgress - Optional callback for tracking upload progress
 * @param signal - Optional abort signal for canceling the request
 * @returns Promise with the created medical report
 */
export const uploadReport = async (
  file: File,
  onProgress?: UploadProgressCallback,
  signal?: AbortSignal,
): Promise<MedicalReport> => {
  try {
    // Import s3StorageService dynamically to avoid circular dependency
    const { s3StorageService } = await import('../services/storage/s3-storage-service');

    // First upload the file to S3
    const s3Key = await s3StorageService.uploadFile(
      file,
      'reports',
      onProgress as (progress: number) => void,
      signal,
    );

    // Then create the report record with the S3 key
    const config = await getAuthConfig(signal);

    // Send the report metadata to the API
    const response = await axios.post(
      `${API_URL}/api/reports`,
      {
        filePath: s3Key,
        originalFilename: file.name,
        fileSize: file.size,
      },
      config,
    );

    return response.data;
  } catch (error) {
    // If the request was aborted, propagate the abort error
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted', 'AbortError');
    }

    if (axios.isAxiosError(error)) {
      console.error('API Error Details:', error.response?.data, error.response?.headers);
      throw new ReportError(`Failed to upload report: ${error.message}`);
    }
    throw new ReportError('Failed to upload report');
  }
};

/**
 * Fetches the latest reports (limited to a specified count).
 * @param limit - Maximum number of reports to fetch
 * @returns Promise with the latest reports
 */
export const fetchLatestReports = async (limit = 3): Promise<MedicalReport[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/reports/latest?limit=${limit}`,
      await getAuthConfig(),
    );
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
    const response = await axios.get(`${API_URL}/api/reports`, await getAuthConfig());
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
    const response = await axios.patch(
      `${API_URL}/api/reports/${reportId}/status`,
      {
        status: 'READ',
      },
      await getAuthConfig(),
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ReportError(`Failed to mark report as read: ${error.message || 'Unknown error'}`);
    }
    throw new ReportError('Failed to mark report as read');
  }
};

/**
 * Toggles the bookmark status of a report.
 * @param reportId - ID of the report to toggle bookmark status
 * @param isBookmarked - Boolean indicating if the report should be bookmarked or not
 * @returns Promise with the updated report
 */
export const toggleReportBookmark = async (
  reportId: string,
  isBookmarked: boolean,
): Promise<MedicalReport> => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/reports/${reportId}/bookmark`,
      {
        bookmarked: isBookmarked,
      },
      await getAuthConfig(),
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ReportError(
        `Failed to toggle bookmark status: ${error.message || 'Unknown error'}`,
      );
    }
    throw new ReportError('Failed to toggle bookmark status');
  }
};

/**
 * Fetches a single medical report by ID
 * @param reportId The ID of the report to fetch
 * @returns Promise with the report data
 */
export const fetchReportById = async (reportId: string): Promise<MedicalReport> => {
  try {
    const response = await axios.get(`${API_URL}/api/reports/${reportId}`, await getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};
