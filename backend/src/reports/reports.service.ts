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

  async findAll(userId: string): Promise<Report[]> {
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    try {
      // Use QueryCommand instead of ScanCommand since userId is the partition key
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
        }),
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

  async findLatest(queryDto: GetReportsQueryDto, userId: string): Promise<Report[]> {
    this.logger.log(
      `Running findLatest with params: ${JSON.stringify(queryDto)} for user ${userId}`,
    );

    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    // Convert limit to a number to avoid serialization errors
    const limit =
      typeof queryDto.limit === 'string' ? parseInt(queryDto.limit, 10) : queryDto.limit || 10;

    try {
      // Use the GSI userIdCreatedAtIndex with QueryCommand for efficient retrieval
      // This is much more efficient than a ScanCommand
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'userIdCreatedAtIndex', // Use the GSI for efficient queries
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
        }),
        ScanIndexForward: false, // Get items in descending order (newest first)
        Limit: limit, // Only fetch the number of items we need
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
          // This could happen if the GSI doesn't exist
          this.logger.warn('GSI validation error, falling back to standard query');

          // Fallback to standard query and sort in memory if GSI has issues
          const fallbackCommand = new QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: marshall({
              ':userId': userId,
            }),
          });

          const fallbackResponse = await this.dynamoClient.send(fallbackCommand);
          const reports = (fallbackResponse.Items || []).map(item => unmarshall(item) as Report);

          // Sort by createdAt in descending order
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
        Key: marshall({ id }),
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
        }
      }

      throw new InternalServerErrorException(`Failed to update report status for ID ${id}`);
    }
  }

  async saveReport(filePath: string, userId: string): Promise<Report> {
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
        title: 'New Report',
        bookmarked: false,
        category: '',
        processingStatus: ProcessingStatus.UNPROCESSED,
        labValues: [],
        summary: '',
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
      // Update report in DynamoDB
      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(report),
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': report.userId,
        }),
      });

      await this.dynamoClient.send(command);
      this.logger.log(`Successfully updated report with ID ${report.id}`);

      return report;
    } catch (error: unknown) {
      this.logger.error(`Error updating report with ID ${report.id}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ConditionalCheckFailedException') {
          throw new ForbiddenException('You do not have permission to update this report');
        } else if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        }
      }

      throw new InternalServerErrorException(`Failed to update report with ID ${report.id}`);
    }
  }
}
