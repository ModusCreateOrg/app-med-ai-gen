import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Supported file types and their MIME types
export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
  JPG: 'image/jpeg',
  PNG: 'image/png'
};

// File size limits in MB
export const FILE_SIZE_LIMITS = {
  PDF: 10, // 10MB
  IMAGE: 5  // 5MB for JPEG and PNG
};

/**
 * Interface for file validation results
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  errorKey?: string;
  params?: {
    max?: number;
    [key: string]: string | number | undefined;
  };
}

/**
 * Validates a file's type and size
 * @param file The file to validate
 * @returns FileValidationResult object with validation status and error info
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check file type
  const validTypes = Object.values(SUPPORTED_FILE_TYPES);
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not supported. Supported types: PDF, JPEG, PNG`,
      errorKey: 'upload.error.invalidType'
    };
  }

  // Check file size
  const fileSize = file.size / (1024 * 1024); // Convert to MB
  const maxSize = file.type === SUPPORTED_FILE_TYPES.PDF ? FILE_SIZE_LIMITS.PDF : FILE_SIZE_LIMITS.IMAGE;
  
  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds limit. Maximum size: ${maxSize}MB`,
      errorKey: 'upload.error.fileTooBig',
      params: { max: maxSize }
    };
  }

  return { isValid: true };
};

/**
 * Format file size to human-readable string
 * @param bytes The file size in bytes
 * @returns Human-readable file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
};

/**
 * Check if the app has permission to read files
 * @returns Promise<boolean> True if permission is granted
 */
export const checkFilePermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    // In browser, we don't need to check permissions
    return true;
  }

  try {
    // Check if we can access the filesystem as a way to verify permissions
    // This is a simple check that should work on both iOS and Android
    await Filesystem.readdir({
      path: '',
      directory: Directory.Documents
    });
    return true;
  } catch (error: unknown) {
    console.error('File permission check failed:', error);
    return false;
  }
};

/**
 * Request file read permissions from the user
 * @returns Promise<boolean> True if permission is granted
 */
export const requestFilePermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    // In browser, we don't need to request permissions
    return true;
  }

  try {
    // On iOS and Android, permissions are requested automatically when needed
    // We can just try to access the filesystem to trigger the permission request
    await Filesystem.readdir({
      path: '',
      directory: Directory.Documents
    });
    return true;
  } catch (error: unknown) {
    console.error('Failed to get file permissions:', error);
    return false;
  }
}; 