import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { uploadReport, ReportError, fetchLatestReports, fetchAllReports, markReportAsRead } from '../reportService';
import { ReportCategory, ReportStatus } from '../../models/medicalReport';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    isAxiosError: vi.fn(() => true)
  }
}));

// Mock response data
const mockReports = [
  {
    id: '1',
    title: 'heart-report',
    status: ReportStatus.UNREAD,
    category: ReportCategory.HEART,
    documentUrl: 'http://example.com/heart-report.pdf',
    date: '2024-03-24',
  },
  {
    id: '2',
    title: 'brain-scan',
    status: ReportStatus.UNREAD,
    category: ReportCategory.NEUROLOGICAL,
    documentUrl: 'http://example.com/brain-scan.pdf',
    date: '2024-03-24',
  }
];

describe('reportService', () => {
  const mockFile = new File(['test content'], 'test-report.pdf', { type: 'application/pdf' });
  let progressCallback: (progress: number) => void;
  
  beforeEach(() => {
    vi.resetAllMocks();
    progressCallback = vi.fn();
  });
  
  describe('uploadReport', () => {
    // Create a mock implementation for FormData
    let mockFormData: { append: ReturnType<typeof vi.fn> };
    
    beforeEach(() => {
      // Mock the internal timers used in uploadReport
      vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        if (typeof fn === 'function') fn();
        return 123 as unknown as NodeJS.Timeout;
      });
      
      vi.spyOn(global, 'setInterval').mockImplementation(() => {
        return 456 as unknown as NodeJS.Timeout;
      });
      
      vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
      
      // Setup mock FormData
      mockFormData = {
        append: vi.fn()
      };
      
      // Mock FormData constructor
      global.FormData = vi.fn(() => mockFormData as unknown as FormData);
    });
    
    test('should upload file successfully', async () => {
      const report = await uploadReport(mockFile, progressCallback);
      
      // Check the returned data matches our expectations
      expect(report).toBeDefined();
      expect(report.title).toBe('test-report');
      expect(report.status).toBe(ReportStatus.UNREAD);
      
      // Verify form data was created with the correct file
      expect(FormData).toHaveBeenCalled();
      expect(mockFormData.append).toHaveBeenCalledWith('file', mockFile);
      
      // Check the progress callback was called
      expect(progressCallback).toHaveBeenCalled();
    });
    
    test('should determine category based on filename', async () => {
      const heartFile = new File(['test'], 'heart-report.pdf', { type: 'application/pdf' });
      const heartReport = await uploadReport(heartFile);
      expect(heartReport.category).toBe(ReportCategory.HEART);
      
      // Reset mocks for the second file
      vi.resetAllMocks();
      mockFormData = { append: vi.fn() };
      global.FormData = vi.fn(() => mockFormData as unknown as FormData);
      
      // Recreate timer mocks for the second upload
      vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
        if (typeof fn === 'function') fn();
        return 123 as unknown as NodeJS.Timeout;
      });
      
      vi.spyOn(global, 'setInterval').mockImplementation(() => {
        return 456 as unknown as NodeJS.Timeout;
      });
      
      vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
      
      const neuroFile = new File(['test'], 'brain-scan.pdf', { type: 'application/pdf' });
      const neuroReport = await uploadReport(neuroFile);
      expect(neuroReport.category).toBe(ReportCategory.NEUROLOGICAL);
    });
    
    test('should handle upload without progress callback', async () => {
      const report = await uploadReport(mockFile);
      expect(report).toBeDefined();
      expect(report.title).toBe('test-report');
    });
    
    test('should throw ReportError on upload failure', async () => {
      // Restore the original FormData
      const originalFormData = global.FormData;
      
      // Mock FormData to throw an error
      global.FormData = vi.fn(() => {
        throw new Error('FormData construction failed');
      });
      
      await expect(uploadReport(mockFile, progressCallback))
        .rejects
        .toThrow(ReportError);
        
      // Restore the previous mock
      global.FormData = originalFormData;
    });
    
    afterEach(() => {
      vi.restoreAllMocks();
    });
  });

  describe('fetchLatestReports', () => {
    beforeEach(() => {
      // Setup axios mock response
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockReports.slice(0, 2)
      });
    });

    test('should fetch latest reports with default limit', async () => {
      const reports = await fetchLatestReports();
      
      expect(axios.get).toHaveBeenCalled();
      expect(reports).toHaveLength(2);
      expect(reports[0]).toEqual(expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String)
      }));
    });
    
    test('should fetch latest reports with custom limit', async () => {
      const limit = 1;
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockReports.slice(0, 1)
      });
      
      const reports = await fetchLatestReports(limit);
      
      expect(axios.get).toHaveBeenCalled();
      expect(reports).toHaveLength(1);
    });
    
    test('should throw ReportError on fetch failure', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
      
      await expect(fetchLatestReports())
        .rejects
        .toThrow(ReportError);
    });
  });

  describe('fetchAllReports', () => {
    beforeEach(() => {
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockReports
      });
    });

    test('should fetch all reports', async () => {
      const reports = await fetchAllReports();
      
      expect(axios.get).toHaveBeenCalled();
      expect(reports).toEqual(mockReports);
    });
    
    test('should throw ReportError on fetch failure', async () => {
      (axios.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
      
      await expect(fetchAllReports())
        .rejects
        .toThrow(ReportError);
    });
  });

  describe('markReportAsRead', () => {
    beforeEach(() => {
      const updatedReport = {
        ...mockReports[0],
        status: ReportStatus.READ
      };
      
      (axios.patch as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: updatedReport
      });
    });

    test('should mark a report as read', async () => {
      const updatedReport = await markReportAsRead('1');
      
      expect(axios.patch).toHaveBeenCalled();
      expect(updatedReport.status).toBe(ReportStatus.READ);
    });
    
    test('should throw error when report not found', async () => {
      (axios.patch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Report not found'));
      
      await expect(markReportAsRead('non-existent-id'))
        .rejects
        .toThrow(ReportError);
    });
  });
}); 