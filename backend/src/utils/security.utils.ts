import { BadRequestException } from '@nestjs/common';

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
 */
export const validateFileSecurely = (buffer: Buffer, mimeType: string): void => {
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
  if (entropy > 7.5) {
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
  if (buffer.length < 12) {
    throw new Error('File too small to be a valid image');
  }

  const signature = buffer.slice(0, 12).toString('hex').toUpperCase();

  // For JPEG
  if (Array.from(JPEG_SIGNATURES).some(sig => signature.startsWith(sig))) {
    // Check for JPEG end marker
    if (!(buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9)) {
      throw new Error('Invalid JPEG structure');
    }
  }
  // For PNG
  else if (signature.startsWith('89504E47')) {
    // Check for IEND chunk
    const iendBuffer = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
    if (!buffer.slice(-8).equals(iendBuffer)) {
      throw new Error('Invalid PNG structure');
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
