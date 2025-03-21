import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  validateFile, 
  checkFilePermissions, 
  requestFilePermissions,
  formatFileSize
} from '../utils/fileUtils';
import { uploadReport, UploadProgressCallback } from '../api/reportService';
import { MedicalReport } from '../models/medicalReport';

export enum UploadStatus {
  IDLE = 'idle',
  VALIDATING = 'validating',
  REQUESTING_PERMISSION = 'requesting_permission',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface UseFileUploadOptions {
  onUploadComplete?: (result: MedicalReport) => void;
}

interface UseFileUploadResult {
  file: File | null;
  status: UploadStatus;
  progress: number;
  error: string | null;
  selectFile: (file: File | null) => void;
  uploadFile: () => Promise<void>;
  reset: () => void;
  formatFileSize: (bytes: number) => string;
}

/**
 * Custom hook for handling file uploads with validation and permissions
 */
export const useFileUpload = ({ onUploadComplete }: UseFileUploadOptions = {}): UseFileUploadResult => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>(UploadStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setStatus(UploadStatus.IDLE);
    setProgress(0);
    setError(null);
  }, []);

  const selectFile = useCallback((selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }

    setStatus(UploadStatus.VALIDATING);
    
    // Validate the file
    const validation = validateFile(selectedFile);
    
    if (!validation.isValid) {
      setStatus(UploadStatus.ERROR);
      setError(validation.errorKey 
        ? t(validation.errorKey, validation.params) 
        : validation.error ?? t('upload.error.unknown')
      );
      return;
    }
    
    setFile(selectedFile);
    setStatus(UploadStatus.IDLE);
    setError(null);
  }, [t]);

  const uploadFile = useCallback(async () => {
    if (!file) {
      setError(t('upload.error.noFile'));
      return;
    }

    try {
      setStatus(UploadStatus.REQUESTING_PERMISSION);
      
      // Check for permissions
      let hasPermission = await checkFilePermissions();
      
      if (!hasPermission) {
        // Request permissions
        hasPermission = await requestFilePermissions();
        
        if (!hasPermission) {
          setStatus(UploadStatus.ERROR);
          setError(t('upload.error.permissionDenied'));
          return;
        }
      }
      
      setStatus(UploadStatus.UPLOADING);
      setProgress(0);
      
      // Create a progress callback for the upload
      const updateProgress: UploadProgressCallback = (progress) => {
        setProgress(progress);
      };
      
      // Upload the file using the API service
      const result = await uploadReport(file, updateProgress);
      
      // Set progress to 100% to indicate completion
      setProgress(1);
      setStatus(UploadStatus.SUCCESS);
      
      // Notify parent component if callback provided
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      setStatus(UploadStatus.ERROR);
      setError(
        error instanceof Error 
          ? error.message 
          : t('upload.error.unknown')
      );
    }
  }, [file, onUploadComplete, t]);

  return {
    file,
    status,
    progress,
    error,
    selectFile,
    uploadFile,
    reset,
    formatFileSize
  };
}; 