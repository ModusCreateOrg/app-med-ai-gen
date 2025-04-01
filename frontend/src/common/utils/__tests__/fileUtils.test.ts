import { validateFile, formatFileSize, FILE_SIZE_LIMITS } from '../fileUtils';
import { vi, describe, test, expect } from 'vitest';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(false),
  },
}));

// Mock Filesystem
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    readdir: vi.fn(),
  },
  Directory: {
    Documents: 'DOCUMENTS',
  },
}));

describe('File utilities', () => {
  describe('validateFile', () => {
    test('should validate valid PDF file', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(file);
      expect(result.isValid).toBe(true);
    });

    test('should validate valid JPEG file', () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(file);
      expect(result.isValid).toBe(true);
    });

    test('should validate valid PNG file', () => {
      const file = new File(['test content'], 'test.png', { type: 'image/png' });
      const result = validateFile(file);
      expect(result.isValid).toBe(true);
    });

    test('should reject unsupported file type', () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = validateFile(file);
      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe('upload.error.invalidType');
    });

    test('should reject PDF exceeding size limit', () => {
      // Create a mock file with size exceeding the limit
      const mockPdf = {
        name: 'large.pdf',
        type: 'application/pdf',
        size: (FILE_SIZE_LIMITS.PDF + 1) * 1024 * 1024, // Size in bytes
      } as File;

      const result = validateFile(mockPdf);
      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe('upload.error.fileTooBig');
      expect(result.params?.max).toBe(FILE_SIZE_LIMITS.PDF);
    });

    test('should reject JPEG exceeding size limit', () => {
      // Create a mock file with size exceeding the limit
      const mockJpeg = {
        name: 'large.jpg',
        type: 'image/jpeg',
        size: (FILE_SIZE_LIMITS.IMAGE + 1) * 1024 * 1024, // Size in bytes
      } as File;

      const result = validateFile(mockJpeg);
      expect(result.isValid).toBe(false);
      expect(result.errorKey).toBe('upload.error.fileTooBig');
      expect(result.params?.max).toBe(FILE_SIZE_LIMITS.IMAGE);
    });
  });

  describe('formatFileSize', () => {
    test('should format bytes correctly', () => {
      expect(formatFileSize(100)).toBe('100 B');
    });

    test('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
    });

    test('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.50 MB');
    });
  });
}); 