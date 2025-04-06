import { BadRequestException, Logger } from '@nestjs/common';

// Common malicious file signatures (magic numbers)
const MALICIOUS_FILE_SIGNATURES = new Set([
  '4D5A', // MZ - Windows executable
  '7F454C46', // ELF - Linux executable
  '504B0304', // ZIP - Could contain malicious files
  'CAFEBABE', // Java class file
]);

// Maximum file size (10MB for images)
export const MAX_FILE_SIZES = {
  'image/jpeg': 10 * 1024 * 1024,
  'image/png': 10 * 1024 * 1024,
  'image/heic': 10 * 1024 * 1024,
  'image/heif': 10 * 1024 * 1024,
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = new Set(Object.keys(MAX_FILE_SIZES));

// Common JPEG signatures from different devices
const JPEG_SIGNATURES = new Set([
  'FFD8FF', // Standard JPEG SOI marker
  'FFD8FFE0', // JPEG/JFIF
  'FFD8FFE1', // JPEG/Exif (common in mobile phones)
  'FFD8FFE2', // JPEG/SPIFF
  'FFD8FFE3', // JPEG/JPEG-LS
  'FFD8FFE8', // JPEG/SPIFF
  'FFD8FFED', // JPEG/IPTC
  'FFD8FFEE', // JPEG/JPEG-LS
]);

// Common PNG signatures
const PNG_SIGNATURES = new Set([
  '89504E47', // Standard PNG
  '89504E470D0A1A0A', // Full PNG header
]);

// HEIC/HEIF signatures
const HEIC_SIGNATURES = new Set([
  '00000020667479706865696300', // HEIC
  '0000001C667479706D696631', // HEIF
  '00000018667479706D696631', // HEIF variation
]);

/**
 * Checks if a buffer starts with any of the malicious file signatures
 */
const hasExecutableSignature = (buffer: Buffer): boolean => {
  // Get first 4 bytes as hex
  const signature = buffer.slice(0, 4).toString('hex').toUpperCase();
  return MALICIOUS_FILE_SIGNATURES.has(signature);
};

/**
 * Validates the actual content type of a file using its magic numbers
 */
const validateFileType = (buffer: Buffer, mimeType: string): boolean => {
  // Get first 12 bytes to check for various signatures
  const signature = buffer.slice(0, 12).toString('hex').toUpperCase();

  switch (mimeType) {
    case 'image/jpeg':
      return Array.from(JPEG_SIGNATURES).some(sig => signature.startsWith(sig));
    case 'image/png':
      return Array.from(PNG_SIGNATURES).some(sig => signature.startsWith(sig));
    case 'image/heic':
    case 'image/heif':
      return Array.from(HEIC_SIGNATURES).some(sig => signature.startsWith(sig));
    default:
      return false;
  }
};

/**
 * Calculates entropy of data to detect potential encrypted/compressed malware
 * High entropy could indicate encrypted/compressed content
 */
const calculateEntropy = (buffer: Buffer): number => {
  const frequencies = new Map<number, number>();

  // Count byte frequencies
  for (const byte of buffer) {
    frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
  }

  // Calculate entropy
  let entropy = 0;
  const bufferLength = buffer.length;

  for (const count of frequencies.values()) {
    const probability = count / bufferLength;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
};

/**
 * Comprehensive file security validation
 * @param buffer The file buffer to validate
 * @param mimeType The declared MIME type of the file
 * @param options Additional validation options
 */
export const validateFileSecurely = (
  buffer: Buffer,
  mimeType: string,
  options: { skipEntropyCheck?: boolean } = {},
): void => {
  const logger = new Logger('SecurityUtils');

  // 1. Check if file type is allowed
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new BadRequestException('Only JPEG, PNG, and HEIC/HEIF images are allowed');
  }

  // 2. Check file size
  const maxSize = MAX_FILE_SIZES[mimeType as keyof typeof MAX_FILE_SIZES];
  if (buffer.length > maxSize) {
    throw new BadRequestException(
      `Image size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
    );
  }

  // 3. Validate actual file content matches claimed type
  if (!validateFileType(buffer, mimeType)) {
    throw new BadRequestException('File content does not match claimed image type');
  }

  // 4. Check for executable signatures
  if (hasExecutableSignature(buffer)) {
    throw new BadRequestException('File contains executable content');
  }

  // 5. Check for suspicious entropy (possible encrypted/compressed malware)
  const entropy = calculateEntropy(buffer);
  logger.log(
    `Image entropy: ${entropy.toFixed(2)}, type: ${mimeType}, size: ${(buffer.length / 1024).toFixed(2)}KB`,
  );

  // Skip entropy check if requested or for PNG (which is naturally highly compressed)
  const skipEntropyCheck = options.skipEntropyCheck || mimeType === 'image/png';

  if (!skipEntropyCheck && entropy > 7.9) {
    logger.warn(
      `High entropy detected: ${entropy.toFixed(2)}, type: ${mimeType} - possible encryption or compression`,
    );
    throw new BadRequestException('File content appears to be encrypted or compressed');
  }

  // 6. Basic structure validation for images
  try {
    validateImageStructure(buffer);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new BadRequestException(`Invalid image structure: ${errorMessage}`);
  }
};

/**
 * Validates basic image structure
 * Checks for proper image headers and dimensions
 */
const validateImageStructure = (buffer: Buffer): void => {
  const logger = new Logger('ImageValidator');

  if (buffer.length < 12) {
    throw new Error('File too small to be a valid image');
  }

  const signature = buffer.slice(0, 12).toString('hex').toUpperCase();
  logger.log(`Image signature: ${signature.substring(0, 8)}...`);

  // For JPEG
  if (Array.from(JPEG_SIGNATURES).some(sig => signature.startsWith(sig))) {
    // Skip JPEG end marker check as some valid JPEGs might not end with standard EOI marker
    // Just check if the file size is reasonable
    if (buffer.length < 100) {
      logger.warn('JPEG file size too small, might be corrupted');
      throw new Error('JPEG file appears to be truncated or corrupted');
    }
  }
  // For PNG
  else if (signature.startsWith('89504E47')) {
    const hasIend = buffer.includes(Buffer.from([0x49, 0x45, 0x4e, 0x44]));

    if (!hasIend) {
      logger.warn('PNG missing IEND chunk');
      throw new Error('Invalid PNG structure: missing IEND chunk');
    }
  }
  // For HEIC/HEIF
  else if (Array.from(HEIC_SIGNATURES).some(sig => signature.startsWith(sig))) {
    // HEIC/HEIF validation is more complex, we'll do basic size validation
    if (buffer.length < 512) {
      // HEIC files are typically larger
      throw new Error('Invalid HEIC/HEIF structure');
    }
  } else {
    throw new Error('Unsupported image format');
  }
};

/**
 * Sanitizes extracted medical data to prevent XSS and injection attacks
 */
export const sanitizeMedicalData = <T extends Record<string, any>>(data: T): T => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/data:/gi, '') // Remove data: URLs
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    }
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
    }
    if (value && typeof value === 'object') {
      return sanitizeObject(value);
    }
    return value;
  };

  const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeValue(value);
    }
    return sanitized;
  };

  return sanitizeObject(data) as T;
};

/**
 * Rate limiting implementation using a rolling window
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  public tryRequest(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or initialize request timestamps for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Remove old timestamps
    timestamps = timestamps.filter(time => time > windowStart);

    // Check if limit is reached
    if (timestamps.length >= this.maxRequests) {
      return false;
    }

    // Add new request timestamp
    timestamps.push(now);
    this.requests.set(identifier, timestamps);

    return true;
  }
}
