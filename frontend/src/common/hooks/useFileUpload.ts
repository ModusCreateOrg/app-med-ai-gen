import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  validateFile,
  checkFilePermissions,
  requestFilePermissions,
  formatFileSize,
} from '../utils/fileUtils';
import { uploadReport, UploadProgressCallback } from '../api/reportService';
import { MedicalReport } from '../models/medicalReport';

export enum UploadStatus {
  IDLE = 'idle',
  VALIDATING = 'validating',
  REQUESTING_PERMISSION = 'requesting_permission',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
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
  cancelUpload: () => void;
}

/**
 * Custom hook for handling file uploads with validation and permissions
 */
export const useFileUpload = ({
  onUploadComplete,
}: UseFileUploadOptions = {}): UseFileUploadResult => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>(UploadStatus.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  // Use a ref to track if upload should be canceled
  const cancelRef = useRef<boolean>(false);
  // Use a ref to hold the AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setStatus(UploadStatus.IDLE);
    setProgress(0);
    setError(null);
    cancelRef.current = false;

    // Abort any pending requests from previous uploads
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const cancelUpload = useCallback(() => {
    cancelRef.current = true;

    // Abort the ongoing request if there's one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (status === UploadStatus.UPLOADING || status === UploadStatus.REQUESTING_PERMISSION) {
      setStatus(UploadStatus.CANCELLED);
      setProgress(0);
    } else {
      reset();
    }
  }, [status, reset]);

  const selectFile = useCallback(
    (selectedFile: File | null) => {
      if (!selectedFile) {
        setFile(null);
        return;
      }

      setStatus(UploadStatus.VALIDATING);

      // Validate the file
      const validation = validateFile(selectedFile);

      if (!validation.isValid) {
        setStatus(UploadStatus.ERROR);
        setError(
          validation.errorKey
            ? t(validation.errorKey, validation.params)
            : (validation.error ?? t('upload.error.unknown')),
        );
        return;
      }

      setFile(selectedFile);
      setStatus(UploadStatus.IDLE);
      setError(null);
    },
    [t],
  );

  // Extract the progress callback outside of uploadFile to reduce complexity
  const createProgressCallback = useCallback((signal: AbortSignal): UploadProgressCallback => {
    return (progress: number) => {
      if (!cancelRef.current && !signal.aborted) {
        setProgress(progress);
      }
    };
  }, []);

  // Helper to check if the upload has been canceled
  const isUploadCanceled = useCallback((signal: AbortSignal): boolean => {
    return cancelRef.current || signal.aborted;
  }, []);

  const uploadFile = useCallback(async () => {
    // Don't proceed if there's no file or if the status is CANCELLED
    if (!file) {
      setError(t('upload.error.noFile'));
      return;
    }

    // If currently in CANCELLED state, we need to reset first
    if (status === UploadStatus.CANCELLED) {
      reset();
      return;
    }

    // Reset cancel flag
    cancelRef.current = false;

    // Create a new AbortController for this upload request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      setStatus(UploadStatus.REQUESTING_PERMISSION);

      // Check and request permissions if needed
      const hasPermission = await checkPermissions();

      if (!hasPermission) {
        setStatus(UploadStatus.ERROR);
        setError(t('upload.error.permissionDenied'));
        return;
      }

      // Check if canceled during permission check
      if (isUploadCanceled(signal)) {
        setStatus(UploadStatus.CANCELLED);
        return;
      }

      setStatus(UploadStatus.UPLOADING);
      setProgress(0);

      // Get a progress callback
      const updateProgress = createProgressCallback(signal);

      // Upload the file
      const result = await uploadReport(file, updateProgress, signal);

      // Check if canceled during upload
      if (isUploadCanceled(signal)) {
        setStatus(UploadStatus.CANCELLED);
        return;
      }

      // Success
      setProgress(1);
      setStatus(UploadStatus.SUCCESS);

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      handleUploadError(error as Error, signal);
    } finally {
      cleanupAbortController(signal);
    }
  }, [file, status, onUploadComplete, t, createProgressCallback, isUploadCanceled, reset]);

  // Helper to handle file permissions
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    let hasPermission = await checkFilePermissions();

    if (!hasPermission) {
      hasPermission = await requestFilePermissions();
    }

    return hasPermission;
  }, []);

  // Helper to handle upload errors
  const handleUploadError = useCallback(
    (error: Error, signal: AbortSignal) => {
      // Don't show error for aborted requests
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      if (!isUploadCanceled(signal)) {
        setStatus(UploadStatus.ERROR);
        setError(error instanceof Error ? error.message : t('upload.error.unknown'));
      }
    },
    [t, isUploadCanceled],
  );

  // Helper to clean up the AbortController
  const cleanupAbortController = useCallback((signal: AbortSignal) => {
    if (abortControllerRef.current?.signal === signal) {
      abortControllerRef.current = null;
    }
  }, []);

  return {
    file,
    status,
    progress,
    error,
    selectFile,
    uploadFile,
    reset,
    formatFileSize,
    cancelUpload,
  };
};
