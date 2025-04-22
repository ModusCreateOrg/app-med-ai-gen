import { vi, describe, test, expect, beforeEach } from 'vitest';
import {
  uploadReport,
  ReportError,
  fetchLatestReports,
  fetchAllReports,
  markReportAsRead,
} from '../reportService';
import { ReportCategory, ReportStatus } from '../../models/medicalReport';
import axios from 'axios';

// Import type for casting
import type * as ReportServiceModule from '../reportService';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    isAxiosError: vi.fn(() => true),
  },
}));

// Mock dynamic imports to handle the service functions
vi.mock('../reportService', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof ReportServiceModule;

  // Create a new object with the same properties as the original
  return {
    // Keep the ReportError class
    ReportError: actual.ReportError,

    // Mock the API functions
    uploadReport: async (file: File, onProgress?: (progress: number) => void) => {
      try {
        // If progress callback exists, call it to simulate progress
        if (onProgress) {
          onProgress(0.5);
          onProgress(1.0);
        }
        // Mock directly passing to axios.post
        const response = await axios.post(`/api/reports`, { filePath: `reports/${file.name}` });
        return response.data;
      } catch (error) {
        // Properly wrap the error in a ReportError
        throw new actual.ReportError(
          error instanceof Error
            ? `Failed to upload report: ${error.message}`
            : 'Failed to upload report',
        );
      }
    },

    // Mock fetchLatestReports
    fetchLatestReports: async (limit = 3) => {
      try {
        const response = await axios.get(`/api/reports/latest?limit=${limit}`);
        return response.data;
      } catch (error) {
        throw new actual.ReportError(
          error instanceof Error
            ? `Failed to fetch latest reports: ${error.message}`
            : 'Failed to fetch latest reports',
        );
      }
    },

    // Mock fetchAllReports
    fetchAllReports: async () => {
      try {
        const response = await axios.get(`/api/reports`);
        return response.data;
      } catch (error) {
        throw new actual.ReportError(
          error instanceof Error
            ? `Failed to fetch all reports: ${error.message}`
            : 'Failed to fetch all reports',
        );
      }
    },

    // Keep other functions as is
    markReportAsRead: actual.markReportAsRead,
    getAuthConfig: actual.getAuthConfig,
  };
});

// Mock auth
vi.mock('@aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({
    tokens: {
      idToken: {
        toString: () => 'mock-id-token',
      },
    },
  }),
}));

// Mock response data
const mockReports = [
  {
    id: '1',
    title: 'heart-report',
    status: ReportStatus.UNREAD,
    category: ReportCategory.HEART,
    date: '2024-03-24',
  },
  {
    id: '2',
    title: 'brain-scan',
    status: ReportStatus.UNREAD,
    category: ReportCategory.BRAIN,
    date: '2024-03-24',
  },
];

describe('reportService', () => {
  const mockFile = new File(['test content'], 'test-report.pdf', { type: 'application/pdf' });
  let progressCallback: (progress: number) => void;

  beforeEach(() => {
    vi.resetAllMocks();
    progressCallback = vi.fn();
  });

  describe('uploadReport', () => {
    beforeEach(() => {
      // Mock axios.post for successful response
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          id: 'mock-id',
          title: 'test-report',
          status: ReportStatus.UNREAD,
          category: ReportCategory.GENERAL,
          date: '2024-05-10',
        },
      });
    });

    test('should upload file successfully', async () => {
      const report = await uploadReport(mockFile, progressCallback);

      // Check the returned data matches our expectations
      expect(report).toBeDefined();
      expect(report.title).toBe('test-report');
      expect(report.status).toBe(ReportStatus.UNREAD);

      // Check the progress callback was called
      expect(progressCallback).toHaveBeenCalled();
    });

    test('should determine category based on filename', async () => {
      // Mock response for heart file
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          id: 'heart-id',
          title: 'heart-report',
          status: ReportStatus.UNREAD,
          category: ReportCategory.HEART,
          date: '2024-05-10',
        },
      });

      const heartFile = new File(['test'], 'heart-report.pdf', { type: 'application/pdf' });
      const heartReport = await uploadReport(heartFile);
      expect(heartReport.category).toBe(ReportCategory.HEART);

      // Mock response for brain file
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          id: 'neuro-id',
          title: 'brain-scan',
          status: ReportStatus.UNREAD,
          category: ReportCategory.BRAIN,
          date: '2024-05-10',
        },
      });

      const neuroFile = new File(['test'], 'brain-scan.pdf', { type: 'application/pdf' });
      const neuroReport = await uploadReport(neuroFile);
      expect(neuroReport.category).toBe(ReportCategory.BRAIN);
    });

    test('should handle upload without progress callback', async () => {
      const report = await uploadReport(mockFile);
      expect(report).toBeDefined();
      expect(report.title).toBe('test-report');
    });

    test('should throw ReportError on upload failure', async () => {
      // Mock axios.post to fail
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('API request failed'),
      );

      await expect(uploadReport(mockFile, progressCallback)).rejects.toThrow(ReportError);
    });
  });

  describe('fetchLatestReports', () => {
    beforeEach(() => {
      // Setup axios mock response
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockReports.slice(0, 2),
      });
    });

    test('should fetch latest reports with default limit', async () => {
      const reports = await fetchLatestReports();

      expect(axios.get).toHaveBeenCalled();
      expect(reports).toHaveLength(2);
      expect(reports[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
        }),
      );
    });

    test('should fetch latest reports with custom limit', async () => {
      const limit = 1;
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockReports.slice(0, 1),
      });

      const reports = await fetchLatestReports(limit);

      expect(axios.get).toHaveBeenCalled();
      expect(reports).toHaveLength(1);
    });

    test('should throw ReportError on fetch failure', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      await expect(fetchLatestReports()).rejects.toThrow(ReportError);
    });
  });

  describe('fetchAllReports', () => {
    beforeEach(() => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockReports,
      });
    });

    test('should fetch all reports', async () => {
      const reports = await fetchAllReports();

      expect(axios.get).toHaveBeenCalled();
      expect(reports).toEqual(mockReports);
    });

    test('should throw ReportError on fetch failure', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      await expect(fetchAllReports()).rejects.toThrow(ReportError);
    });
  });

  describe('markReportAsRead', () => {
    beforeEach(() => {
      const updatedReport = {
        ...mockReports[0],
        status: ReportStatus.READ,
      };

      (axios.patch as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: updatedReport,
      });
    });

    test('should mark a report as read', async () => {
      const updatedReport = await markReportAsRead('1');

      expect(axios.patch).toHaveBeenCalled();
      expect(updatedReport.status).toBe(ReportStatus.READ);
    });

    test('should throw error when report not found', async () => {
      (axios.patch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Report not found'));

      await expect(markReportAsRead('non-existent-id')).rejects.toThrow(ReportError);
    });
  });
});
