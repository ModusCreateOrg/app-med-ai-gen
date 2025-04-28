import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DynamoDBClient,
  GetItemCommand,
  UpdateItemCommand,
  DynamoDBServiceException,
  PutItemCommand,
  QueryCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Report, ReportStatus, ProcessingStatus } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportsService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;
  private readonly logger = new Logger(ReportsService.name);

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('aws.region') || 'us-east-1';

    // Get optional AWS credentials if they exist
    const accessKeyId = this.configService.get<string>('aws.aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.aws.secretAccessKey');
    const sessionToken = this.configService.get<string>('aws.aws.sessionToken');

    const clientOptions: any = { region };

    if (accessKeyId && secretAccessKey) {
      clientOptions.credentials = {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken }),
      };
    }

    try {
      this.dynamoClient = new DynamoDBClient(clientOptions);
    } catch (error: unknown) {
      this.logger.error('Failed to initialize DynamoDB client:', error);
      throw new InternalServerErrorException('Failed to initialize database connection');
    }

    this.tableName = this.configService.get<string>('dynamodbReportsTable')!;
  }

  async findAll(userId: string, onlyProcessed = true): Promise<Report[]> {
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    try {
      const expressionAttributeValues: any = { ':userId': userId };
      const processingStatusFilter = 'processingStatus = :processedStatus';

      if (onlyProcessed) {
        expressionAttributeValues[':processedStatus'] = ProcessingStatus.PROCESSED;
      }

      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: onlyProcessed ? processingStatusFilter : undefined,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
      });

      const response = await this.dynamoClient.send(command);
      return (response.Items || []).map(item => unmarshall(item) as Report);
    } catch (error: unknown) {
      this.logger.error(`Error fetching reports for user ${userId}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'UnrecognizedClientException') {
          throw new InternalServerErrorException(
            'Invalid AWS credentials. Please check your AWS configuration.',
          );
        } else if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        }
      }

      throw new InternalServerErrorException('Failed to fetch reports from database');
    }
  }

  async findLatest(
    queryDto: GetReportsQueryDto,
    userId: string,
    onlyProcessed = true,
  ): Promise<Report[]> {
    this.logger.log(
      `Running findLatest with params: ${JSON.stringify(queryDto)} for user ${userId}`,
    );

    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    const limit =
      typeof queryDto.limit === 'string' ? parseInt(queryDto.limit, 10) : queryDto.limit || 10;

    const expressionAttributeValues: any = { ':userId': userId };

    try {
      const processingStatusFilter = 'processingStatus = :processedStatus';

      if (onlyProcessed) {
        expressionAttributeValues[':processedStatus'] = ProcessingStatus.PROCESSED;
      }

      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'userIdCreatedAtIndex',
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: onlyProcessed ? processingStatusFilter : undefined,
        ExpressionAttributeValues: marshall(expressionAttributeValues),
        ScanIndexForward: false,
        Limit: limit,
      });

      const response = await this.dynamoClient.send(command);
      return (response.Items || []).map(item => unmarshall(item) as Report);
    } catch (error: unknown) {
      this.logger.error(`Error fetching latest reports for user ${userId}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        } else if (error.name === 'ValidationException') {
          this.logger.warn('GSI validation error, falling back to standard query');

          const fallbackCommand = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: marshall(expressionAttributeValues),
          });

          const fallbackResponse = await this.dynamoClient.send(fallbackCommand);
          const reports = (fallbackResponse.Items || []).map(item => unmarshall(item) as Report);

          return reports
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
        }
      }

      throw new InternalServerErrorException('Failed to fetch latest reports from database');
    }
  }

  async findOne(id: string, userId: string): Promise<Report> {
    if (!id) {
      throw new NotFoundException('Report ID is required');
    }

    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({
        userId, // Partition key
        id, // Sort key
      }),
    });

    try {
      const response = await this.dynamoClient.send(command);

      if (!response.Item) {
        throw new NotFoundException(`Report with ID ${id} not found`);
      }

      const report = unmarshall(response.Item) as Report;

      return report;
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Error fetching report with ID ${id}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        } else if (error.name === 'UnrecognizedClientException') {
          throw new InternalServerErrorException(
            'Invalid AWS credentials. Please check your AWS configuration.',
          );
        } else if (error.name === 'ValidationException') {
          throw new InternalServerErrorException(
            'The provided key structure does not match the table schema. Please check your DynamoDB table configuration.',
          );
        }
      }

      throw new InternalServerErrorException(`Failed to fetch report with ID ${id}`);
    }
  }

  async updateStatus(
    id: string,
    updateDto: UpdateReportStatusDto,
    userId: string,
  ): Promise<Report> {
    if (!id) {
      throw new NotFoundException('Report ID is required');
    }

    if (!updateDto || !updateDto.status) {
      throw new InternalServerErrorException('Status is required for update');
    }

    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    try {
      // First check if the report exists and belongs to the user
      const existingReport = await this.findOne(id, userId);

      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({
          userId, // Partition key
          id, // Sort key
        }),
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ConditionExpression: 'userId = :userId', // Ensure the report belongs to the user
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
          ':status': updateDto.status,
          ':updatedAt': new Date().toISOString(),
          ':userId': userId,
        }),
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.dynamoClient.send(command);

      if (!response.Attributes) {
        // If for some reason Attributes is undefined, return the existing report with updated status
        return {
          ...existingReport,
          status: updateDto.status,
          updatedAt: new Date().toISOString(),
        };
      }

      return unmarshall(response.Attributes) as Report;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Error updating report status for ID ${id}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ConditionalCheckFailedException') {
          throw new ForbiddenException('You do not have permission to update this report');
        } else if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        } else if (error.name === 'ValidationException') {
          this.logger.error(
            `DynamoDB validation error updating status for report ID ${id}: ${error.message}`,
          );
          throw new InternalServerErrorException(
            `Validation error updating report status: ${error.message}`,
          );
        } else if (error.name === 'ProvisionedThroughputExceededException') {
          this.logger.warn(`DynamoDB throughput exceeded for report ID ${id}`);
          throw new InternalServerErrorException(
            'Database capacity limit reached, please try again later',
          );
        }
      }

      throw new InternalServerErrorException(`Failed to update report status for ID ${id}`);
    }
  }

  /**
   * Save a new report to DynamoDB
   * @param filePath S3 object path of the uploaded file
   * @param userId User ID of the report owner
   * @param originalFilename Original filename of the uploaded file
   * @param fileSize Size of the file in bytes
   * @returns The saved report
   */
  async saveReport(
    filePath: string,
    userId: string,
    originalFilename: string = 'Unknown filename',
    fileSize: number = 0,
  ): Promise<Report> {
    if (!filePath) {
      throw new NotFoundException('File URL is required');
    }

    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    try {
      const newReport: Report = {
        id: uuidv4(),
        userId,
        filePath,
        originalFilename,
        fileSize,
        title: 'New Report',
        bookmarked: false,
        category: '',
        processingStatus: ProcessingStatus.UNPROCESSED,
        labValues: [],
        summary: '',
        confidence: 0,
        status: ReportStatus.UNREAD,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to DynamoDB
      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(newReport),
      });

      await this.dynamoClient.send(command);
      this.logger.log(`Successfully saved report with ID ${newReport.id} for user ${userId}`);

      return newReport;
    } catch (error: unknown) {
      this.logger.error(`Error saving report for user ${userId}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        }
      }

      throw new InternalServerErrorException('Failed to save report to database');
    }
  }

  /**
   * Update a report with new data
   * @param report Updated report object
   * @returns The updated report
   */
  async updateReport(report: Report): Promise<Report> {
    if (!report || !report.id) {
      throw new NotFoundException('Report ID is required');
    }

    if (!report.userId) {
      throw new ForbiddenException('User ID is required');
    }

    try {
      // First check if the report exists and belongs to the user
      await this.findOne(report.id, report.userId);

      // Set the updatedAt timestamp
      report.updatedAt = new Date().toISOString();

      // Update report in DynamoDB
      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({
          userId: report.userId, // Partition key
          id: report.id, // Sort key
        }),
        UpdateExpression:
          'SET #title = :title, #bookmarked = :bookmarked, #category = :category, ' +
          '#processingStatus = :processingStatus, #labValues = :labValues, #summary = :summary, ' +
          '#confidence = :confidence, #status = :status, #missingInformation = :missingInformation, #isMedicalReport = :isMedicalReport, #updatedAt = :updatedAt',
        ConditionExpression: 'userId = :userId', // Ensure the report belongs to the user
        ExpressionAttributeNames: {
          '#title': 'title',
          '#bookmarked': 'bookmarked',
          '#category': 'category',
          '#processingStatus': 'processingStatus',
          '#labValues': 'labValues',
          '#summary': 'summary',
          '#confidence': 'confidence',
          '#status': 'status',
          '#missingInformation': 'missingInformation',
          '#isMedicalReport': 'isMedicalReport',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: marshall({
          ':title': report.title,
          ':bookmarked': report.bookmarked,
          ':category': report.category,
          ':processingStatus': report.processingStatus,
          ':labValues': report.labValues,
          ':summary': report.summary,
          ':confidence': report.confidence,
          ':status': report.status,
          ':missingInformation': report.missingInformation,
          ':isMedicalReport': report.isMedicalReport,
          ':updatedAt': report.updatedAt,
          ':userId': report.userId,
        }),
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.dynamoClient.send(command);

      if (!response.Attributes) {
        return report; // Return the updated report if no Attributes returned
      }

      return unmarshall(response.Attributes) as Report;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Error updating report with ID ${report.id}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ConditionalCheckFailedException') {
          throw new ForbiddenException('You do not have permission to update this report');
        } else if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        } else if (error.name === 'ValidationException') {
          this.logger.error(
            `DynamoDB validation error for report ID ${report.id}: ${error.message}`,
          );
          throw new InternalServerErrorException(
            `Validation error updating report: ${error.message}`,
          );
        } else if (error.name === 'ProvisionedThroughputExceededException') {
          this.logger.warn(`DynamoDB throughput exceeded for report ID ${report.id}`);
          throw new InternalServerErrorException(
            'Database capacity limit reached, please try again later',
          );
        }
      }

      throw new InternalServerErrorException(`Failed to update report with ID ${report.id}`);
    }
  }

  /**
   * Toggle the bookmark status of a report
   * @param id Report ID
   * @param bookmarked New bookmark status
   * @param userId User ID
   * @returns The updated report
   */
  async toggleBookmark(id: string, bookmarked: boolean, userId: string): Promise<Report> {
    if (!id) {
      throw new NotFoundException('Report ID is required');
    }

    if (bookmarked === undefined) {
      throw new InternalServerErrorException('Bookmark status is required');
    }

    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    try {
      // First check if the report exists and belongs to the user
      const existingReport = await this.findOne(id, userId);

      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({
          userId,
          id,
        }),
        UpdateExpression: 'SET bookmarked = :bookmarked, updatedAt = :updatedAt',
        ConditionExpression: 'userId = :userId', // Add condition to ensure we're updating the right user's report
        ExpressionAttributeValues: marshall({
          ':bookmarked': bookmarked,
          ':updatedAt': new Date().toISOString(),
          ':userId': userId,
        }),
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.dynamoClient.send(command);

      if (!response.Attributes) {
        // If for some reason Attributes is undefined, return the existing report with updated bookmark status
        return {
          ...existingReport,
          bookmarked,
          updatedAt: new Date().toISOString(),
        };
      }

      return unmarshall(response.Attributes) as Report;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Error toggling bookmark for report ID ${id}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ConditionalCheckFailedException') {
          throw new ForbiddenException('You do not have permission to update this report');
        } else if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        } else if (error.name === 'ValidationException') {
          this.logger.error(
            `DynamoDB validation error toggling bookmark for report ID ${id}: ${error.message}`,
          );
          throw new InternalServerErrorException(
            `Validation error toggling bookmark: ${error.message}`,
          );
        } else if (error.name === 'ProvisionedThroughputExceededException') {
          this.logger.warn(`DynamoDB throughput exceeded for report ID ${id}`);
          throw new InternalServerErrorException(
            'Database capacity limit reached, please try again later',
          );
        }
      }

      throw new InternalServerErrorException(`Failed to toggle bookmark for report ID ${id}`);
    }
  }

  /**
   * Delete a report by ID
   * @param reportId Report ID
   * @param userId User ID
   * @returns A confirmation message
   */
  async deleteReport(reportId: string, userId: string): Promise<string> {
    if (!reportId) {
      throw new NotFoundException('Report ID is required');
    }

    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    try {
      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: marshall({
          userId,
          id: reportId,
        }),
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
        }),
      });

      await this.dynamoClient.send(command);
      this.logger.log(`Successfully deleted report with ID ${reportId} for user ${userId}`);

      return `Report with ID ${reportId} successfully deleted`;
    } catch (error: unknown) {
      this.logger.error(`Error deleting report with ID ${reportId}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ConditionalCheckFailedException') {
          throw new ForbiddenException('You do not have permission to delete this report');
        } else if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        }
      }

      throw new InternalServerErrorException(`Failed to delete report with ID ${reportId}`);
    }
  }
}
