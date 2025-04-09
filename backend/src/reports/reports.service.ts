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
  ScanCommand,
  GetItemCommand,
  UpdateItemCommand,
  DynamoDBServiceException,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Report, ReportStatus } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportsService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;
  private readonly logger = new Logger(ReportsService.name);

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

    try {
      this.dynamoClient = new DynamoDBClient(clientConfig);
    } catch (error: unknown) {
      this.logger.error('Failed to initialize DynamoDB client:', error);
      throw new InternalServerErrorException('Failed to initialize database connection');
    }

    this.tableName = this.configService.get<string>('DYNAMODB_REPORTS_TABLE', 'reports');
  }

  async findAll(userId: string): Promise<Report[]> {
    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    try {
      // If the table has a GSI for userId, use QueryCommand instead
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'userId = :userId',
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
      // If the table has a GSI for userId, use QueryCommand instead
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
        }),
        Limit: limit * 5, // Fetch more items since we'll filter by userId
      });

      const response = await this.dynamoClient.send(command);
      const reports = (response.Items || []).map(item => unmarshall(item) as Report);

      // Sort by createdAt in descending order
      return reports
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error: unknown) {
      this.logger.error(`Error fetching latest reports for user ${userId}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
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
      Key: marshall({ id }),
    });

    try {
      const response = await this.dynamoClient.send(command);

      if (!response.Item) {
        throw new NotFoundException(`Report with ID ${id} not found`);
      }

      const report = unmarshall(response.Item) as Report;

      // Verify the report belongs to the user
      if (report.userId !== userId) {
        throw new ForbiddenException('You do not have permission to access this report');
      }

      return report;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Error fetching report with ID ${id}:`);
      this.logger.error(error);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
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

  async saveReport(fileUrl: string, userId: string): Promise<Report> {
    if (!fileUrl) {
      throw new NotFoundException('File URL is required');
    }

    if (!userId) {
      throw new ForbiddenException('User ID is required');
    }

    try {
      const newReport: Report = {
        id: uuidv4(),
        userId,
        fileUrl,
        title: 'New Report',
        bookmark: false,
        category: '',
        date: '',
        doctor: '',
        facility: '',
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
}
