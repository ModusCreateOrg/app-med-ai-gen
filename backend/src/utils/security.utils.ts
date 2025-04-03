import { BadRequestException } from '@nestjs/common';

// Common malicious file signatures (magic numbers)
const MALICIOUS_FILE_SIGNATURES = new Set([
  '4D5A', // MZ - Windows executable
  '7F454C46', // ELF - Linux executable
  '504B0304', // ZIP - Could contain malicious files
  'CAFEBABE', // Java class file
]);

// Maximum file size (10MB for images, 20MB for PDFs)
export const MAX_FILE_SIZES = {
  'application/pdf': 20 * 1024 * 1024,
  'image/jpeg': 10 * 1024 * 1024,
  'image/png': 10 * 1024 * 1024,
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = new Set(Object.keys(MAX_FILE_SIZES));

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
  const signature = buffer.slice(0, 4).toString('hex').toUpperCase();

  switch (mimeType) {
    case 'application/pdf':
      return signature.startsWith('25504446'); // %PDF
    case 'image/jpeg':
      return signature.startsWith('FFD8FF'); // JPEG SOI marker
    case 'image/png':
      return signature === '89504E47'; // PNG signature
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
    throw new BadRequestException('File type not allowed');
  }

  // 2. Check file size
  const maxSize = MAX_FILE_SIZES[mimeType as keyof typeof MAX_FILE_SIZES];
  if (buffer.length > maxSize) {
    throw new BadRequestException(
      `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
    );
  }

  // 3. Validate actual file content matches claimed type
  if (!validateFileType(buffer, mimeType)) {
    throw new BadRequestException('File content does not match claimed type');
  }

  // 4. Check for executable signatures
  if (hasExecutableSignature(buffer)) {
    throw new BadRequestException('File contains executable content');
  }

  // 5. Check for suspicious entropy (possible encrypted/compressed malware)
  const entropy = calculateEntropy(buffer);
  if (entropy > 7.5) {
    // Typical threshold for encrypted/compressed content
    throw new BadRequestException('File content appears to be encrypted or compressed');
  }

  // 6. Basic structure validation based on file type
  try {
    switch (mimeType) {
      case 'application/pdf':
        validatePdfStructure(buffer);
        break;
      case 'image/jpeg':
      case 'image/png':
        validateImageStructure(buffer);
        break;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new BadRequestException(`Invalid file structure: ${errorMessage}`);
  }
};

/**
 * Validates basic PDF structure
 * Checks for PDF header and EOF marker
 */
const validatePdfStructure = (buffer: Buffer): void => {
  // Check PDF header
  if (!buffer.slice(0, 5).toString().startsWith('%PDF-')) {
    throw new Error('Invalid PDF header');
  }

  // Check for EOF marker
  const tail = buffer.slice(-6).toString();
  if (!tail.includes('%%EOF')) {
    throw new Error('Missing PDF EOF marker');
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

  // For JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    // Check for JPEG end marker
    if (!(buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9)) {
      throw new Error('Invalid JPEG structure');
    }
  }
  // For PNG
  else if (buffer.slice(0, 8).toString('hex').toUpperCase() === '89504E470D0A1A0A') {
    // Check for IEND chunk
    const iendBuffer = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
    if (!buffer.slice(-8).equals(iendBuffer)) {
      throw new Error('Invalid PNG structure');
    }
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
