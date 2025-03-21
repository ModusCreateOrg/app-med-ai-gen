import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Report } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Injectable()
export class ReportsService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');

    try {
      this.dynamoClient = new DynamoDBClient({
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      });
    } catch (error: unknown) {
      console.error('DynamoDB Client Config:', JSON.stringify(error, null, 2));
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

      const clientConfig: any = { region };

      // Only add credentials if both values are present
      if (accessKeyId && secretAccessKey) {
        clientConfig.credentials = { accessKeyId, secretAccessKey };
      }

      this.dynamoClient = new DynamoDBClient(clientConfig);
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
      console.error('DynamoDB Error Details:', JSON.stringify(error, null, 2));
      if (error instanceof Error && error.name === 'UnrecognizedClientException') {
        throw new Error(
          'Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.',
        );
      }
      throw error;
    }
  }

  async findLatest(queryDto: GetReportsQueryDto): Promise<Report[]> {
    const limit = queryDto.limit || 10;

    const command = new ScanCommand({
      TableName: this.tableName,
      Limit: limit,
    });

    const response = await this.dynamoClient.send(command);
    const reports = (response.Items || []).map(item => unmarshall(item) as Report);

    // Sort by createdAt in descending order
    return reports
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async findOne(id: string): Promise<Report> {
    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({ id }),
    });

    const response = await this.dynamoClient.send(command);

    if (!response.Item) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return unmarshall(response.Item) as Report;
  }

  async updateStatus(id: string, updateDto: UpdateReportStatusDto): Promise<Report> {
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
  }
}
