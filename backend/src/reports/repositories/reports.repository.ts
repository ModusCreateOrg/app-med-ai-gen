import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Report, CreateReportDto, UpdateReportDto, ReportStatus } from '../models/report.model';

interface FindByUserOptions {
  limit?: number;
  cursor?: string;
}

@Injectable()
export class ReportsRepository {
  private readonly logger = new Logger(ReportsRepository.name);
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private configService: ConfigService) {
    const client = new DynamoDBClient({
      region: this.configService.get<string>('aws.region'),
    });

    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = this.configService.get<string>('aws.dynamodb.reportsTable', 'reports');
  }

  async create(userId: string, createReportDto: CreateReportDto): Promise<Report> {
    const now = new Date().toISOString();
    const report: Report = {
      id: createReportDto.id || uuidv4(),
      userId,
      title: createReportDto.title,
      content: createReportDto.content,
      status: ReportStatus.UNREAD,
      createdAt: now,
      updatedAt: now,
    };

    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: report,
    }));

    return report;
  }

  async findOne(userId: string, reportId: string): Promise<Report | null> {
    try {
      const response = await this.docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          userId,
          id: reportId,
        },
      }));

      return response.Item as Report;
    } catch (error) {
      this.logger.error(`Error fetching report: ${error}`);
      return null;
    }
  }

  async findByUser(userId: string, options?: FindByUserOptions): Promise<{ items: Report[]; nextCursor?: string }> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Sort in descending order (newest first)
        Limit: options?.limit,
        ...(options?.cursor && { ExclusiveStartKey: JSON.parse(Buffer.from(options.cursor, 'base64').toString()) }),
      });

      const response = await this.docClient.send(command);

      let nextCursor: string | undefined;
      if (response.LastEvaluatedKey) {
        nextCursor = Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64');
      }

      return {
        items: response.Items as Report[],
        nextCursor,
      };
    } catch (error) {
      this.logger.error(`Error fetching user reports: ${error}`);
      return { items: [] };
    }
  }

  async update(userId: string, reportId: string, updateReportDto: UpdateReportDto): Promise<Report | null> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {
      ':updatedAt': new Date().toISOString(),
    };

    Object.entries(updateReportDto).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });

    try {
      const response = await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          userId,
          id: reportId,
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}, updatedAt = :updatedAt`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      }));

      return response.Attributes as Report;
    } catch (error) {
      this.logger.error(`Error updating report: ${error}`);
      return null;
    }
  }

  async delete(userId: string, reportId: string): Promise<boolean> {
    try {
      await this.docClient.send(new DeleteCommand({
        TableName: this.tableName,
        Key: {
          userId,
          id: reportId,
        },
      }));

      return true;
    } catch (error) {
      this.logger.error(`Error deleting report: ${error}`);
      return false;
    }
  }

  async updateStatus(userId: string, reportId: string, status: ReportStatus): Promise<Report | null> {
    try {
      const response = await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: {
          userId,
          id: reportId,
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      }));

      return response.Attributes as Report;
    } catch (error) {
      this.logger.error(`Error updating report status: ${error}`);
      return null;
    }
  }

  async countByUser(userId: string): Promise<number> {
    try {
      const response = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        Select: 'COUNT',
      }));

      return response.Count || 0;
    } catch (error) {
      this.logger.error(`Error counting user reports: ${error}`);
      return 0;
    }
  }
}
