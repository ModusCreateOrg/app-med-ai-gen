import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CompletedPart,
} from '@aws-sdk/client-s3';
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
  // Set a chunk size of 5MB as recommended by AWS for multipart uploads
  private readonly CHUNK_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  // File size threshold for when to use multipart upload
  private readonly MULTIPART_THRESHOLD = 10 * 1024 * 1024; // 10MB

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
      expiration: session.credentials.expiration,
    };
  }

  /**
   * Updates the S3 client with fresh credentials
   */
  private async refreshCredentials() {
    const credentials = await this.getCredentials();

    this.s3Client = new S3Client({
      region: this.region,
      credentials,
    });
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
    signal?: AbortSignal,
  ): Promise<string> {
    // Check if already aborted before starting
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted', 'AbortError');
    }

    // Generate a unique filename to prevent collisions
    const uniqueFilename = `${uuidv4()}-${file.name}`;
    const key = `${folder}/${uniqueFilename}`;

    // Check if file size exceeds the multipart threshold
    if (file.size > this.MULTIPART_THRESHOLD) {
      return this.uploadLargeFile(file, key, onProgress, signal);
    } else {
      return this.uploadSmallFile(file, key, onProgress, signal);
    }
  }

  /**
   * Gets a pre-signed URL for uploading to S3
   * @param key - S3 key (path) for the file
   * @param contentType - Content type of the file
   * @returns Promise with the signed URL
   */
  private async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  /**
   * Uploads a small file using XMLHttpRequest for better progress tracking
   * @param file - The file to upload
   * @param key - S3 key to use for the file
   * @param onProgress - Optional callback for tracking upload progress
   * @param signal - Optional abort signal for canceling the request
   * @returns Promise with the S3 key of the uploaded file
   */
  private async uploadSmallFile(
    file: File,
    key: string,
    onProgress?: StorageProgressCallback,
    signal?: AbortSignal,
  ): Promise<string> {
    try {
      // Refresh credentials
      await this.refreshCredentials();

      // Check if aborted after getting credentials
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }

      // Get a pre-signed URL for putting the object
      const presignedUrl = await this.getPresignedUploadUrl(key, file.type);

      // Check if aborted after getting pre-signed URL
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }

      // Use XMLHttpRequest for better progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Set up progress tracking
        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = event.loaded / event.total;
              onProgress(progress);
            }
          };
        }

        // Set up completion and error handlers
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Ensure 100% progress is reported on success
            if (onProgress) onProgress(1);
            resolve(key);
          } else {
            reject(new StorageError(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new StorageError('Network error occurred during upload'));
        };

        xhr.onabort = () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        };

        // Open the request
        xhr.open('PUT', presignedUrl);

        // Set content type explicitly
        xhr.setRequestHeader('Content-Type', file.type);

        // Start the upload
        xhr.send(file);

        // Set up abort handling if signal is provided
        if (signal) {
          const abortHandler = () => xhr.abort();
          signal.addEventListener('abort', abortHandler);

          // Clean up event listener when request completes or errors
          const cleanupAbortHandler = () => {
            signal.removeEventListener('abort', abortHandler);
          };

          xhr.onload = (_event) => {
            cleanupAbortHandler();
            if (xhr.status >= 200 && xhr.status < 300) {
              if (onProgress) onProgress(1);
              resolve(key);
            } else {
              reject(
                new StorageError(`Upload failed with status ${xhr.status}: ${xhr.statusText}`),
              );
            }
          };

          xhr.onerror = (_event) => {
            cleanupAbortHandler();
            reject(new StorageError('Network error occurred during upload'));
          };

          xhr.onabort = (_event) => {
            cleanupAbortHandler();
            reject(new DOMException('The operation was aborted', 'AbortError'));
          };
        }
      });
    } catch (error) {
      // Check if this is an abort error
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }

      console.error('Error uploading file to S3:', error);
      throw new StorageError(
        error instanceof Error
          ? `Failed to upload file: ${error.message}`
          : 'Failed to upload file',
      );
    }
  }

  /**
   * Uploads a large file using S3 multipart upload
   * @param file - The file to upload
   * @param key - S3 key to use for the file
   * @param onProgress - Optional callback for tracking upload progress
   * @param signal - Optional abort signal for canceling the request
   * @returns Promise with the S3 key of the uploaded file
   */
  private async uploadLargeFile(
    file: File,
    key: string,
    onProgress?: StorageProgressCallback,
    signal?: AbortSignal,
  ): Promise<string> {
    try {
      // Refresh credentials
      await this.refreshCredentials();

      // Check if aborted after getting credentials
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }

      // Initialize multipart upload
      const createMultipartUploadResponse = await this.s3Client.send(
        new CreateMultipartUploadCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: file.type,
        }),
      );

      const uploadId = createMultipartUploadResponse.UploadId;
      if (!uploadId) {
        throw new StorageError('Failed to initialize multipart upload');
      }

      try {
        // Calculate total number of chunks
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
        const uploadPartPromises = [];
        const uploadedParts: CompletedPart[] = [];

        // Track progress for multipart upload
        let totalUploaded = 0;
        const fileSize = file.size;

        // Report initial progress
        if (onProgress && !signal?.aborted) {
          onProgress(0);
        }

        // Upload each chunk
        for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
          // Check if aborted before processing each chunk
          if (signal?.aborted) {
            throw new DOMException('The operation was aborted', 'AbortError');
          }

          // Calculate chunk boundaries
          const start = (partNumber - 1) * this.CHUNK_SIZE;
          const end = Math.min(partNumber * this.CHUNK_SIZE, file.size);
          const chunkSize = end - start;

          // Extract chunk from file
          const chunk = file.slice(start, end);
          const chunkBuffer = await chunk.arrayBuffer();

          // Create promise for uploading this part
          const uploadPartPromise = this.s3Client
            .send(
              new UploadPartCommand({
                Bucket: this.bucketName,
                Key: key,
                PartNumber: partNumber,
                UploadId: uploadId,
                Body: new Uint8Array(chunkBuffer),
              }),
            )
            .then((response) => {
              // Check if aborted before updating progress
              if (signal?.aborted) {
                throw new DOMException('The operation was aborted', 'AbortError');
              }

              // Add to list of uploaded parts
              uploadedParts.push({
                ETag: response.ETag,
                PartNumber: partNumber,
              });

              // Update progress
              totalUploaded += chunkSize;
              if (onProgress && !signal?.aborted) {
                onProgress(totalUploaded / fileSize);
              }

              return response;
            });

          uploadPartPromises.push(uploadPartPromise);
        }

        // Wait for all parts to upload
        await Promise.all(uploadPartPromises);

        // Check if aborted before completing
        if (signal?.aborted) {
          throw new DOMException('The operation was aborted', 'AbortError');
        }

        // Complete the multipart upload
        await this.s3Client.send(
          new CompleteMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
              Parts: uploadedParts.sort((a, b) => a.PartNumber! - b.PartNumber!),
            },
          }),
        );

        // Ensure 100% progress is reported
        if (onProgress && !signal?.aborted) {
          onProgress(1);
        }

        return key;
      } catch (error) {
        // Abort the multipart upload if anything went wrong
        if (uploadId) {
          try {
            await this.s3Client.send(
              new AbortMultipartUploadCommand({
                Bucket: this.bucketName,
                Key: key,
                UploadId: uploadId,
              }),
            );
          } catch (abortError) {
            console.error('Error aborting multipart upload:', abortError);
          }
        }
        throw error;
      }
    } catch (error) {
      // Check if this is an abort error
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }

      console.error('Error uploading file to S3:', error);
      throw new StorageError(
        error instanceof Error
          ? `Failed to upload file: ${error.message}`
          : 'Failed to upload file',
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
      // Refresh credentials
      await this.refreshCredentials();

      // Create the command to get the object
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // Generate signed URL
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('Error getting signed URL from S3:', error);
      throw new StorageError(
        error instanceof Error
          ? `Failed to get signed URL: ${error.message}`
          : 'Failed to get signed URL',
      );
    }
  }
}

// Export a singleton instance
export const s3StorageService = new S3StorageService();
