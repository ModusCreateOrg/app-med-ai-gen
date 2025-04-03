import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  UpdateItemCommand,
  DynamoDBServiceException,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Report } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

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

  async findAll(): Promise<Report[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
    });

    try {
      const response = await this.dynamoClient.send(command);
      return (response.Items || []).map(item => unmarshall(item) as Report);
    } catch (error: unknown) {
      this.logger.error(`Error fetching all reports: ${this.formatError(error)}`);

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

  async findLatest(queryDto: GetReportsQueryDto): Promise<Report[]> {
    this.logger.log(`Running findLatest with params: ${JSON.stringify(queryDto)}`);

    // Convert limit to a number to avoid serialization errors
    const limit =
      typeof queryDto.limit === 'string' ? parseInt(queryDto.limit, 10) : queryDto.limit || 10;

    const command = new ScanCommand({
      TableName: this.tableName,
      Limit: limit,
    });

    try {
      const response = await this.dynamoClient.send(command);
      const reports = (response.Items || []).map(item => unmarshall(item) as Report);

      // Sort by createdAt in descending order
      return reports
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error: unknown) {
      this.logger.error(`Error fetching latest reports: ${this.formatError(error)}`);

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

  async findOne(id: string): Promise<Report> {
    if (!id) {
      throw new NotFoundException('Report ID is required');
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

      return unmarshall(response.Item) as Report;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Error fetching report with ID ${id}: ${this.formatError(error)}`);

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

  async updateStatus(id: string, updateDto: UpdateReportStatusDto): Promise<Report> {
    if (!id) {
      throw new NotFoundException('Report ID is required');
    }

    if (!updateDto || !updateDto.status) {
      throw new InternalServerErrorException('Status is required for update');
    }

    try {
      // First check if the report exists
      const existingReport = await this.findOne(id);

      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({ id }),
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: marshall({
          ':status': updateDto.status,
          ':updatedAt': new Date().toISOString(),
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

      this.logger.error(`Error updating report status for ID ${id}: ${this.formatError(error)}`);

      if (error instanceof DynamoDBServiceException) {
        if (error.name === 'ConditionalCheckFailedException') {
          throw new NotFoundException(`Report with ID ${id} not found`);
        } else if (error.name === 'ResourceNotFoundException') {
          throw new InternalServerErrorException(
            `Table "${this.tableName}" not found. Please check your database configuration.`,
          );
        }
      }

      throw new InternalServerErrorException(`Failed to update status for report with ID ${id}`);
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    return JSON.stringify(error, null, 2);
  }
}
