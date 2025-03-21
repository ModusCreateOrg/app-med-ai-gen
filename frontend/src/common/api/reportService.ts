import axios, { AxiosProgressEvent, AxiosRequestConfig } from 'axios';
import { MedicalReport, ReportStatus, ReportCategory } from '../models/medicalReport';

// Base API URL - should be configured from environment variables in a real app
// Removed unused API_URL variable

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
 * Determines a report category based on filename
 * This is just for mock demonstration
 */
const determineCategory = (filename: string): ReportCategory => {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('heart') || lowerFilename.includes('cardiac') || lowerFilename.includes('stress')) {
    return ReportCategory.HEART;
  } else if (lowerFilename.includes('brain') || lowerFilename.includes('neuro')) {
    return ReportCategory.NEUROLOGICAL;
  } else if (lowerFilename.includes('eye') || lowerFilename.includes('vision')) {
    return ReportCategory.OFTALMOLOGICAL;
  } else if (lowerFilename.includes('stomach') || lowerFilename.includes('gastro')) {
    return ReportCategory.GASTRO;
  } else if (lowerFilename.includes('bone') || lowerFilename.includes('joint')) {
    return ReportCategory.ORTHOPEDIC;
  }
  
  return ReportCategory.GENERAL;
};

/**
 * Fetches the latest reports (limited to a specified count).
 * @param limit - Maximum number of reports to fetch
 * @returns Promise with the latest reports
 */
export const fetchLatestReports = async (limit = 3): Promise<MedicalReport[]> => {
  try {
    // In a real app, this would be an actual API call
    // const response = await axios.get(`/api/reports/latest?limit=${limit}`);
    // return response.data;
    
    // For now, return mock data
    return mockReports.slice(0, limit);
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
    // In a real app, this would be an actual API call
    // const response = await axios.get(`/api/reports`);
    // return response.data;
    
    // For now, return mock data
    return mockReports;
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
    // In a real app, this would be an actual API call
    // const response = await axios.patch(`/api/reports/${reportId}`, {
    //   status: ReportStatus.READ
    // });
    // return response.data;
    
    // For now, update mock data
    const report = mockReports.find(r => r.id === reportId);
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

// Mock data for development
const mockReports: MedicalReport[] = [
  {
    id: '1',
    title: 'Blood Test',
    category: ReportCategory.GENERAL,
    date: '2025-01-27',
    status: ReportStatus.UNREAD,
    doctor: 'Dr. Smith',
    facility: 'City Hospital'
  },
  {
    id: '2',
    title: 'Cranial Nerve Exam',
    category: ReportCategory.NEUROLOGICAL,
    date: '2025-01-19',
    status: ReportStatus.UNREAD,
    doctor: 'Dr. Johnson',
    facility: 'Neurology Center'
  },
  {
    id: '3',
    title: 'Stress Test',
    category: ReportCategory.HEART,
    date: '2024-12-26',
    status: ReportStatus.READ,
    doctor: 'Dr. Williams',
    facility: 'Heart Institute'
  }
]; 