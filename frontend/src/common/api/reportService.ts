import axios from 'axios';
import { MedicalReport, ReportStatus } from '../models/medicalReport';

// Base API URL - should be configured from environment variables in a real app
const API_URL = '/api';

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
 * Fetches the latest reports (limited to a specified count).
 * @param limit - Maximum number of reports to fetch
 * @returns Promise with the latest reports
 */
export const fetchLatestReports = async (limit = 3): Promise<MedicalReport[]> => {
  try {
    // In a real app, this would be an actual API call
    // const response = await axios.get(`${API_URL}/reports/latest?limit=${limit}`);
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
    // const response = await axios.get(`${API_URL}/reports`);
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
    // const response = await axios.patch(`${API_URL}/reports/${reportId}`, {
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
    category: 'General' as any,
    date: '2025-01-27',
    status: ReportStatus.UNREAD,
    doctor: 'Dr. Smith',
    facility: 'City Hospital'
  },
  {
    id: '2',
    title: 'Cranial Nerve Exam',
    category: 'Neurological' as any,
    date: '2025-01-19',
    status: ReportStatus.UNREAD,
    doctor: 'Dr. Johnson',
    facility: 'Neurology Center'
  },
  {
    id: '3',
    title: 'Stress Test',
    category: 'Heart' as any,
    date: '2024-12-26',
    status: ReportStatus.READ,
    doctor: 'Dr. Williams',
    facility: 'Heart Institute'
  }
]; 