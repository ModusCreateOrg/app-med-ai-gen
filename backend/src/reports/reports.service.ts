import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DynamoDBClient,
  ScanCommand,
  GetItemCommand,
  UpdateItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Report, ReportStatus } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Injectable()
export class ReportsService {
  private readonly dynamoClient: DynamoDBClient;
  private readonly tableName: string;

  constructor(private configService: ConfigService) {
    this.dynamoClient = new DynamoDBClient({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
    });
    this.tableName = this.configService.get<string>('DYNAMODB_TABLE_NAME', 'reports');
  }

  async findAll(): Promise<Report[]> {
    const command = new ScanCommand({
      TableName: this.tableName,
    });

    const response = await this.dynamoClient.send(command);
    return (response.Items || []).map(item => unmarshall(item) as Report);
  }

  async findLatest(queryDto: GetReportsQueryDto): Promise<Report[]> {
    const limit = queryDto.limit || 10;

    const command = new ScanCommand({
      TableName: this.tableName,
      Limit: limit,
      ScanIndexForward: false, // This will sort in descending order
    });

    const response = await this.dynamoClient.send(command);
    const reports = (response.Items || []).map(item => unmarshall(item) as Report);

    // Sort by createdAt in descending order
    return reports.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, limit);
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
    await this.findOne(id);

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
    return unmarshall(response.Attributes) as Report;
  }
}
