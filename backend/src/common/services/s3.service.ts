import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    // Prepare client configuration
    const clientConfig: any = { region };

    // Only add credentials if both values are present
    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = { accessKeyId, secretAccessKey };
    }

    this.s3Client = new S3Client(clientConfig);

    const bucketName = this.configService.get<string>('S3_BUCKET_NAME');

    if (!bucketName) {
      this.logger.error('S3_BUCKET_NAME environment variable is not set');
      throw new InternalServerErrorException('S3 bucket configuration is missing');
    }

    this.bucketName = bucketName;
  }

  /**
   * Uploads a file to S3 with server-side encryption
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    customFileName?: string,
  ): Promise<{
    fileName: string;
    filePath: string;
    fileUrl: string;
    mimeType: string;
    size: number;
  }> {
    try {
      // Generate a unique file name if not provided
      const fileName = customFileName || this.generateFileName(file.originalname);

      // Create path: userId/reports/fileName
      const filePath = `${userId}/reports/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
        // Enable server-side encryption
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client.send(command);

      // Generate a pre-signed URL for temporary access
      const fileUrl = await this.getSignedUrl(filePath);

      return {
        fileName,
        filePath: `s3://${this.bucketName}/${filePath}`,
        fileUrl,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (error: unknown) {
      // Properly handle unknown error type
      this.logger.error(
        `Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }

  /**
   * Generates a pre-signed URL for temporary file access
   */
  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error: unknown) {
      // Properly handle unknown error type
      this.logger.error(
        `Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException('Failed to generate file access URL');
    }
  }

  /**
   * Deletes a file from S3
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(command);
    } catch (error: unknown) {
      // Properly handle unknown error type
      this.logger.error(
        `Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException('Failed to delete file from storage');
    }
  }

  /**
   * Generates a unique file name
   */
  private generateFileName(originalName: string): string {
    const fileExtension = originalName.split('.').pop();
    const randomId = uuidv4();
    return `${randomId}-report.${fileExtension}`;
  }
}
