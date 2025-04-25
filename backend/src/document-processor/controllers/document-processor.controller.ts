import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
  Get,
  Req,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DocumentProcessorService } from '../services/document-processor.service';
import { ReportsService } from '../../reports/reports.service';
import { RequestWithUser } from '../../auth/auth.middleware';
import { Readable } from 'stream';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { ProcessingStatus } from '../../reports/models/report.model';

@Controller('document-processor')
export class DocumentProcessorController {
  private readonly logger = new Logger(DocumentProcessorController.name);

  constructor(
    private readonly documentProcessorService: DocumentProcessorService,
    private readonly reportsService: ReportsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('process-file')
  async processReport(
    @Body('reportId') reportId: string,
    @Req() request: RequestWithUser,
  ): Promise<any> {
    if (!reportId) {
      throw new BadRequestException('No reportId provided');
    }

    // Extract userId from the request (attached by auth middleware)
    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    this.logger.log(`Queueing document for processing, report ID: ${reportId}`);

    try {
      // Fetch the associated report record from DynamoDB using findOne method
      const report = await this.reportsService.findOne(reportId, userId);
      if (!report) {
        throw new NotFoundException(`Report with ID ${reportId} not found`);
      }

      // Make sure we have a filePath to retrieve the file
      if (!report.filePath) {
        throw new BadRequestException(`Report with ID ${reportId} has no associated file`);
      }

      let message = '';

      if (report.processingStatus === ProcessingStatus.IN_PROGRESS) {
        message = 'Document processing is already in progress. Please check the report status.';
      } else if (report.processingStatus === ProcessingStatus.PROCESSED) {
        message = 'Document has already been processed. No further action is needed.';
      } else {
        message = 'Document processing started. Check the report status to know when it completes.';

        // Update report status to IN_PROGRESS before starting async processing
        report.processingStatus = ProcessingStatus.IN_PROGRESS;
        report.updatedAt = new Date().toISOString();
        await this.reportsService.updateReport(report);

        // Start async processing in background
        this.processReportAsync(reportId, userId, report.filePath).catch(error => {
          this.logger.error(`Async processing failed for report ${reportId}: ${error.message}`);
        });
      }

      return {
        success: true,
        reportId: report.id,
        status: report.processingStatus,
        message,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error queueing document for report ID ${reportId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Processes a report file asynchronously
   * @param reportId - ID of the report to process
   * @param userId - ID of the user who owns the report
   * @param filePath - S3 path to the file
   */
  private async processReportAsync(
    reportId: string,
    userId: string,
    filePath: string,
  ): Promise<void> {
    try {
      this.logger.log(`Started async processing for report: ${reportId}`);

      // Fetch the report again to ensure we have the latest version
      const report = await this.reportsService.findOne(reportId, userId);
      if (!report) {
        this.logger.error(`Report ${reportId} not found during async processing`);

        return;
      }

      // Get the file from S3
      let fileBuffer;
      try {
        fileBuffer = await this.getFileFromS3(filePath);
        this.logger.log(`Successfully retrieved file from S3 for report: ${reportId}`);
      } catch (error) {
        const errorMessage = `Failed to retrieve file from S3 for report ${reportId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.logger.error(errorMessage);
        await this.failReport(reportId, userId, errorMessage);
        return;
      }

      // Process the document
      let result;
      try {
        result = await this.documentProcessorService.processDocument(fileBuffer, userId);
        this.logger.log(`Successfully processed document for report: ${reportId}`);
      } catch (error) {
        const errorMessage = `Failed to process document for report ${reportId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.logger.error(errorMessage);
        await this.failReport(reportId, userId, errorMessage);
        return;
      }

      if (!result.analysis.metadata.isMedicalReport) {
        this.logger.log(`Report ${reportId} is not a medical report.`);
        report.processingStatus = ProcessingStatus.FAILED;
        report.errorMessage = 'Document is not a medical report';
        report.updatedAt = new Date().toISOString();
        await this.reportsService.updateReport(report);

        return;
      }

      // Update the report with analysis results
      report.title = result.analysis.title;
      report.category = result.analysis.category;
      report.processingStatus = ProcessingStatus.PROCESSED;

      // Extract lab values
      report.labValues = result.analysis.labValues || [];

      report.confidence = result.analysis.metadata.confidence || 0;

      // Create summary from simplified explanation or diagnoses
      report.summary = result.simplifiedExplanation!;

      report.updatedAt = new Date().toISOString();

      // Update the report in DynamoDB
      await this.reportsService.updateReport(report);

      this.logger.log(`Completed async processing for report: ${reportId}`);
    } catch (error) {
      // If processing fails, update the report status to indicate failure
      const errorMessage = `Error during async processing for report ${reportId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      await this.failReport(reportId, userId, errorMessage);
    }
  }

  /**
   * Updates a report's processing status to FAILED and logs a error message
   * @param reportId - ID of the report to update
   * @param userId - ID of the user who owns the report
   * @param errorMessage - Optional error message describing the failure
   */
  private async failReport(
    reportId: string,
    userId: string,
    errorMessage: string | undefined = undefined,
  ): Promise<void> {
    try {
      const report = await this.reportsService.findOne(reportId, userId);
      if (report) {
        report.processingStatus = ProcessingStatus.FAILED;
        report.updatedAt = new Date().toISOString();
        report.errorMessage = errorMessage;
        await this.reportsService.updateReport(report);
        this.logger.log(`Updated status of report ${reportId} to FAILED`);
      }
    } catch (updateError: unknown) {
      this.logger.error(
        `Failed to update report status after processing error: ${
          updateError instanceof Error ? updateError.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Retrieves a file from S3 storage
   * @param filePath - The S3 key of the file
   * @returns Buffer containing the file data
   */
  private async getFileFromS3(filePath: string): Promise<Buffer> {
    try {
      const bucketName = this.configService.get<string>('aws.s3.uploadBucket');
      if (!bucketName) {
        throw new InternalServerErrorException('S3 bucket name not configured');
      }

      const region = this.configService.get<string>('aws.region') || 'us-east-1';

      // Get optional AWS credentials if they exist
      const accessKeyId = this.configService.get<string>('aws.aws.accessKeyId');
      const secretAccessKey = this.configService.get<string>('aws.aws.secretAccessKey');
      const sessionToken = this.configService.get<string>('aws.aws.sessionToken');

      // Create S3 client with credentials if they exist
      const s3ClientOptions: any = { region };

      if (accessKeyId && secretAccessKey) {
        s3ClientOptions.credentials = {
          accessKeyId,
          secretAccessKey,
          ...(sessionToken && { sessionToken }),
        };
      }

      const s3Client = new S3Client(s3ClientOptions);

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: filePath,
      });

      const response = await s3Client.send(command);

      // Check if response.Body exists before converting
      if (!response.Body) {
        throw new InternalServerErrorException('Empty response from S3');
      }

      // Convert the readable stream to a buffer
      return await this.streamToBuffer(response.Body as Readable);
    } catch (error) {
      this.logger.error(
        `Error retrieving file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException(
        `Failed to retrieve file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Converts a readable stream to a buffer
   * @param stream - The readable stream from S3
   * @returns Buffer containing the stream data
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  @Get('report-status/:reportId')
  async getReportStatus(@Req() request: RequestWithUser): Promise<any> {
    // Get reportId from path parameter
    const reportId = request.params.reportId;

    if (!reportId) {
      throw new BadRequestException('No reportId provided');
    }

    // Extract userId from the request (attached by auth middleware)
    const userId = request.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    try {
      // Fetch the associated report record from DynamoDB
      const report = await this.reportsService.findOne(reportId, userId);
      if (!report) {
        throw new NotFoundException(`Report with ID ${reportId} not found`);
      }

      return {
        reportId: report.id,
        status: report.processingStatus,
        isComplete: report.processingStatus === ProcessingStatus.PROCESSED,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error fetching report status for ${reportId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
