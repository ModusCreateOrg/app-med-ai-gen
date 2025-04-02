import axios, { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import { MedicalReport, ReportStatus, ReportCategory } from '../models/medicalReport';
import { fetchAuthSession } from '@aws-amplify/auth';
// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_BASE_URL_API || '';

const mockReports: MedicalReport[] = [
  {
    id: '1',
    title: 'Heart Scan',
    category: ReportCategory.HEART,
    date: '2024-01-01',
    status: ReportStatus.UNREAD,
    documentUrl: 'https://example.com/reports/1/heart_scan.pdf'
  }
];

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
 * Maps categories to their identifying keywords for report classification
 */
const CATEGORY_KEYWORDS = {
  [ReportCategory.HEART]: ['heart', 'cardiac', 'stress'],
  [ReportCategory.NEUROLOGICAL]: ['brain', 'neuro'],
  [ReportCategory.OFTALMOLOGICAL]: ['eye', 'vision', 'optic'],
  [ReportCategory.GASTRO]: ['stomach', 'gastro', 'digestive'],
  [ReportCategory.ORTHOPEDIC]: ['bone', 'joint', 'skeletal'],
  [ReportCategory.GENERAL]: []
} as const;

/**
 * Uploads a medical report file
 * @param file - The file to upload
 * @param onProgress - Optional callback for tracking upload progress
 * @returns Promise with the created medical report
 */
export const uploadReport = async (
  file: File,
  onProgress?: UploadProgressCallback
): Promise<MedicalReport> => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);

    // Optional metadata about the file
    formData.append('fileName', file.name);
    formData.append('fileType', file.type);
    formData.append('fileSize', file.size.toString());

    // Setup request config with progress tracking if callback provided
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent: AxiosProgressEvent) => {
        const percentCompleted = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total) / 100
          : 0;
        onProgress(percentCompleted);
      };
    }

    // In a real app, this would be an actual API call
    // const response = await axios.post('/api/reports/upload', formData, config);
    // return response.data;

    // For demonstration purposes, simulate upload delay and return mock data
    await new Promise<void>(resolve => {
      // Simulate progress updates
      if (onProgress) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 0.1;
          if (progress >= 1) {
            clearInterval(interval);
            progress = 1;
          }
          onProgress(progress);
        }, 200);

        // Resolve after simulated upload time
        setTimeout(() => {
          clearInterval(interval);
          onProgress(1);
          resolve();
        }, 2000);
      } else {
        // If no progress callback, just wait
        setTimeout(resolve, 2000);
      }
    });

    // Create a new report based on the uploaded file
    const newReport: MedicalReport = {
      id: String(mockReports.length + 1),
      title: file.name.split('.')[0], // Use filename without extension as title
      category: determineCategory(file.name),
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      status: ReportStatus.UNREAD,
      documentUrl: `https://example.com/reports/${mockReports.length + 1}/${file.name}` // Mock URL
    };

    // Add to mock data
    mockReports.unshift(newReport);

    return newReport;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new ReportError(`Failed to upload report: ${error.message}`);
    }
    throw new ReportError('Failed to upload report');
  }
};

/**
 * Determines a report category based on filename keywords
 * @param filename - Name of the file to categorize
 * @returns The determined report category
 */
const determineCategory = (filename: string): ReportCategory => {
  const lowerFilename = filename.toLowerCase();

  const matchedCategory = Object.entries(CATEGORY_KEYWORDS).find(([_, keywords]) =>
    keywords.some(keyword => lowerFilename.includes(keyword))
  );

  return matchedCategory ? (matchedCategory[0] as ReportCategory) : ReportCategory.GENERAL;
};

/**
 * Fetches the latest reports (limited to a specified count).
 * @param limit - Maximum number of reports to fetch
 * @returns Promise with the latest reports
 */
export const fetchLatestReports = async (limit = 3): Promise<MedicalReport[]> => {

  const headers = await getAuthConfig();
  console.log('headers', JSON.stringify(headers));
  console.log('API_URL', `${API_URL}/api/reports/latest?limit=${limit}`);

  try {
    const response = await axios.get(`${API_URL}/api/reports/latest?limit=${limit}`, headers);
    console.log('response', response.data);
    console.log('response headers', response.headers);
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
