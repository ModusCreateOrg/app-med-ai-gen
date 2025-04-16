import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { fetchAuthSession } from '@aws-amplify/auth';
import { S3_CONFIG } from '../../config/aws-config';

/**
 * Progress callback for tracking file uploads
 */
export interface StorageProgressCallback {
  (progress: number): void;
}

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Service for interacting with S3 storage
 */
export class S3StorageService {
  private s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  
  constructor() {
    // Get region and bucket name from configuration
    this.region = S3_CONFIG.REGION;
    this.bucketName = S3_CONFIG.BUCKET;
    
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.region,
      // Credentials will be loaded dynamically when needed
    });
  }
  
  /**
   * Get temporary AWS credentials from Cognito identity pool
   * @returns Promise with credentials
   */
  private async getCredentials() {
    const session = await fetchAuthSession();
    if (!session.credentials) {
      throw new Error('No credentials available');
    }
    
    return {
      accessKeyId: session.credentials.accessKeyId,
      secretAccessKey: session.credentials.secretAccessKey,
      sessionToken: session.credentials.sessionToken,
      expiration: session.credentials.expiration
    };
  }

  /**
   * Uploads a file to S3 storage
   * @param file - The file to upload
   * @param folder - Optional folder path to store the file in
   * @param onProgress - Optional callback for tracking upload progress
   * @param signal - Optional abort signal for canceling the request
   * @returns Promise with the S3 key of the uploaded file
   */
  public async uploadFile(
    file: File, 
    folder: string = 'reports', 
    onProgress?: StorageProgressCallback,
    signal?: AbortSignal
  ): Promise<string> {
    // Check if already aborted before starting
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted', 'AbortError');
    }
    
    // Set up progress simulation timers that we'll need to clear if aborted
    const progressTimers: NodeJS.Timeout[] = [];
    
    try {
      // Get credentials
      const credentials = await this.getCredentials();
      
      // Check if aborted after getting credentials
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }
      
      // Update client with fresh credentials
      this.s3Client = new S3Client({
        region: this.region,
        credentials
      });
      
      // Generate a unique filename to prevent collisions
      const uniqueFilename = `${uuidv4()}-${file.name}`;
      const key = `${folder}/${uniqueFilename}`;
      
      // Check if aborted before reading file
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }
      
      // Upload file to S3
      const arrayBuffer = await file.arrayBuffer();
      
      // Check if aborted after reading file
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }
      
      const fileBuffer = new Uint8Array(arrayBuffer);
      
      // Create the upload command
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type
      };
      
      // For progress tracking, we'd need to use a more advanced approach
      // using the AWS SDK v3's send middleware, but for simplicity, we'll
      // simulate progress here
      if (onProgress && !signal?.aborted) {
        // Simulate progress update with ability to cancel
        onProgress(0.1);
        
        // Store timers so they can be cleared if aborted
        progressTimers.push(
          setTimeout(() => {
            if (!signal?.aborted) onProgress(0.3);
          }, 300),
          setTimeout(() => {
            if (!signal?.aborted) onProgress(0.6);
          }, 600),
          setTimeout(() => {
            if (!signal?.aborted) onProgress(0.8);
          }, 800)
        );
      }
      
      // Setup abort handler for the signal
      let abortHandler: (() => void) | undefined;
      
      if (signal) {
        const abortPromise = new Promise<never>((_, reject) => {
          abortHandler = () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          };
          signal.addEventListener('abort', abortHandler);
        });
        
        try {
          // Create a race between the upload and abortion
          await Promise.race([
            this.s3Client.send(new PutObjectCommand(uploadParams)),
            abortPromise
          ]);
        } finally {
          // Clean up the event listener to prevent memory leaks
          if (abortHandler && signal) {
            signal.removeEventListener('abort', abortHandler);
          }
        }
      } else {
        // Upload to S3 without abort capability
        await this.s3Client.send(new PutObjectCommand(uploadParams));
      }
      
      // Clean up all progress timers before marking complete
      progressTimers.forEach(timer => clearTimeout(timer));
      
      // Complete the progress if needed
      if (onProgress && !signal?.aborted) {
        onProgress(1);
      }
      
      return key;
    } catch (error) {
      // Clean up all progress timers
      progressTimers.forEach(timer => clearTimeout(timer));
      
      // Check if this is an abort error
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }
      
      console.error('Error uploading file to S3:', error);
      throw new StorageError(
        error instanceof Error 
          ? `Failed to upload file: ${error.message}` 
          : 'Failed to upload file'
      );
    }
  }

  /**
   * Gets a signed URL for an S3 object
   * @param key - The S3 key of the object
   * @param expiresIn - Expiration time in seconds (default: 3600)
   * @returns Promise with the signed URL
   */
  public async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      // Get credentials
      const credentials = await this.getCredentials();
      
      // Update client with fresh credentials
      this.s3Client = new S3Client({
        region: this.region,
        credentials
      });
      
      // Create the command to get the object
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      // Generate signed URL
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error getting signed URL from S3:', error);
      throw new StorageError(
        error instanceof Error 
          ? `Failed to get signed URL: ${error.message}` 
          : 'Failed to get signed URL'
      );
    }
  }
}

// Export a singleton instance
export const s3StorageService = new S3StorageService();