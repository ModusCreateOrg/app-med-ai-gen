import { renderHook, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useFileUpload, UploadStatus } from '../useFileUpload';
import { UploadProgressCallback } from '../../api/reportService';
import { MedicalReport } from '../../models/medicalReport';

// Mock the dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'upload.error.fileTooBig' && params) {
        return `File too big (max: ${params.max}MB)`;
      }
      return key;
    },
  }),
}));

vi.mock('../../utils/fileUtils', () => ({
  validateFile: vi.fn(),
  checkFilePermissions: vi.fn().mockResolvedValue(true),
  requestFilePermissions: vi.fn().mockResolvedValue(true),
  formatFileSize: vi.fn((size: number) => `${size} bytes`),
}));

vi.mock('../../api/reportService', () => ({
  uploadReport: vi.fn(),
  UploadProgressCallback: vi.fn(),
}));

// Import the mocked functions for direct access in tests
import { validateFile, checkFilePermissions, requestFilePermissions } from '../../utils/fileUtils';
import { uploadReport } from '../../api/reportService';

// Define mocked function types
type MockedValidateFile = { mockReturnValue: (value: { isValid: boolean, errorKey?: string }) => void };
type MockedUploadReport = { 
  mockImplementation: (fn: (file: File, progressCallback?: UploadProgressCallback) => Promise<MedicalReport>) => void;
  mockRejectedValue: (err: Error) => void;
};
type MockedPermissionCheck = { mockResolvedValue: (value: boolean) => void };

describe('useFileUpload hook', () => {
  const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
  const mockReport: Partial<MedicalReport> = { id: '123', title: 'test' };
  
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock implementation with safer type casting
    (validateFile as unknown as MockedValidateFile).mockReturnValue({ isValid: true });
    (uploadReport as unknown as MockedUploadReport).mockImplementation((file: File, progressCallback?: UploadProgressCallback) => {
      if (progressCallback) progressCallback(1);
      return Promise.resolve(mockReport as MedicalReport);
    });
    // Make sure checkFilePermissions always passes for most tests
    (checkFilePermissions as unknown as MockedPermissionCheck).mockResolvedValue(true);
    (requestFilePermissions as unknown as MockedPermissionCheck).mockResolvedValue(true);
  });
  
  test('should have initial state', () => {
    const { result } = renderHook(() => useFileUpload());
    
    expect(result.current.file).toBeNull();
    expect(result.current.status).toBe(UploadStatus.IDLE);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });
  
  test('should select a valid file', () => {
    const { result } = renderHook(() => useFileUpload());
    
    act(() => {
      result.current.selectFile(mockFile);
    });
    
    expect(validateFile).toHaveBeenCalledWith(mockFile);
    expect(result.current.file).toBe(mockFile);
    expect(result.current.status).toBe(UploadStatus.IDLE);
  });
  
  test('should reject an invalid file', () => {
    (validateFile as unknown as MockedValidateFile).mockReturnValue({ 
      isValid: false, 
      errorKey: 'upload.error.invalidType' 
    });
    
    const { result } = renderHook(() => useFileUpload());
    
    act(() => {
      result.current.selectFile(mockFile);
    });
    
    expect(validateFile).toHaveBeenCalledWith(mockFile);
    expect(result.current.file).toBeNull();
    expect(result.current.status).toBe(UploadStatus.ERROR);
    expect(result.current.error).toBe('upload.error.invalidType');
  });
  
  test('should upload a file successfully', async () => {
    const onUploadCompleteMock = vi.fn();
    const { result } = renderHook(() => 
      useFileUpload({ onUploadComplete: onUploadCompleteMock })
    );
    
    // First select a file
    act(() => {
      result.current.selectFile(mockFile);
    });
    
    // Then upload it - make sure we wait for all promises to resolve
    await act(async () => {
      const uploadPromise = result.current.uploadFile();
      await uploadPromise; // ensure we wait for all promises
    });
    
    expect(checkFilePermissions).toHaveBeenCalled();
    expect(uploadReport).toHaveBeenCalledWith(mockFile, expect.any(Function));
    expect(result.current.status).toBe(UploadStatus.SUCCESS);
    expect(result.current.progress).toBe(1);
    expect(onUploadCompleteMock).toHaveBeenCalledWith(mockReport);
  });
  
  test('should handle upload error', async () => {
    (uploadReport as unknown as MockedUploadReport).mockRejectedValue(new Error('Upload failed'));
    
    const { result } = renderHook(() => useFileUpload());
    
    // First select a file
    act(() => {
      result.current.selectFile(mockFile);
    });
    
    // Then try to upload it - make sure we wait for all promises to resolve/reject
    await act(async () => {
      try {
        const uploadPromise = result.current.uploadFile();
        await uploadPromise;
      } catch {
        // Expected error, can be ignored in test
      }
    });
    
    expect(uploadReport).toHaveBeenCalledWith(mockFile, expect.any(Function));
    expect(result.current.status).toBe(UploadStatus.ERROR);
    expect(result.current.error).toBe('Upload failed');
  });
  
  test('should handle permission denial', async () => {
    (checkFilePermissions as unknown as MockedPermissionCheck).mockResolvedValue(false);
    (requestFilePermissions as unknown as MockedPermissionCheck).mockResolvedValue(false);
    
    const { result } = renderHook(() => useFileUpload());
    
    // First select a file
    act(() => {
      result.current.selectFile(mockFile);
    });
    
    // Then try to upload it
    await act(async () => {
      await result.current.uploadFile();
    });
    
    expect(checkFilePermissions).toHaveBeenCalled();
    expect(requestFilePermissions).toHaveBeenCalled();
    expect(uploadReport).not.toHaveBeenCalled();
    expect(result.current.status).toBe(UploadStatus.ERROR);
    expect(result.current.error).toBe('upload.error.permissionDenied');
  });
  
  test('should reset state correctly', () => {
    const { result } = renderHook(() => useFileUpload());
    
    // First select a file
    act(() => {
      result.current.selectFile(mockFile);
    });
    
    // Then reset
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.file).toBeNull();
    expect(result.current.status).toBe(UploadStatus.IDLE);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
  });
}); 