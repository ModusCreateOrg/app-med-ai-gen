import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ValidationPipe,
  Req,
  UnauthorizedException,
  Post,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ProcessingStatus, Report } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { RequestWithUser } from '../auth/auth.middleware';

@ApiTags('reports')
@Controller('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({
    status: 200,
    description: 'Returns all reports for the authenticated user',
    type: [Report],
  })
  @Get()
  async findAll(@Req() request: RequestWithUser): Promise<Report[]> {
    const userId = this.extractUserId(request);
    return this.reportsService.findAll(userId);
  }

  @ApiOperation({ summary: 'Get latest reports' })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest reports for the authenticated user',
    type: [Report],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of reports to return',
  })
  @Get('latest')
  async findLatest(
    @Query(ValidationPipe) queryDto: GetReportsQueryDto,
    @Req() request: RequestWithUser,
  ): Promise<Report[]> {
    const userId = this.extractUserId(request);
    return this.reportsService.findLatest(queryDto, userId);
  }

  @ApiOperation({ summary: 'GET report' })
  @ApiResponse({
    status: 200,
    description: 'Report details',
    type: Report,
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Report ID',
  })
  @Get(':id')
  async getReport(@Param('id') id: string, @Req() request: RequestWithUser): Promise<Report> {
    const userId = this.extractUserId(request);
    const report = await this.reportsService.findOne(id, userId);

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.processingStatus === ProcessingStatus.FAILED) {
      throw new NotFoundException('Processing failed');
    }

    return report;
  }

  @ApiOperation({ summary: 'Update report status' })
  @ApiResponse({
    status: 200,
    description: 'Report status updated successfully',
    type: Report,
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Report ID',
  })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateReportStatusDto,
    @Req() request: RequestWithUser,
  ): Promise<Report> {
    const userId = this.extractUserId(request);
    return this.reportsService.updateStatus(id, updateDto, userId);
  }

  @ApiOperation({ summary: 'Toggle report bookmark status' })
  @ApiResponse({
    status: 200,
    description: 'Report bookmark status toggled successfully',
    type: Report,
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Report ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bookmarked: {
          type: 'boolean',
          description: 'New bookmark status',
        },
      },
      required: ['bookmarked'],
    },
  })
  @Patch(':id/bookmark')
  async toggleBookmark(
    @Param('id') id: string,
    @Body('bookmarked') bookmarked: boolean,
    @Req() request: RequestWithUser,
  ): Promise<Report> {
    const userId = this.extractUserId(request);
    return this.reportsService.toggleBookmark(id, bookmarked, userId);
  }

  @ApiOperation({ summary: 'Create a new report from S3 file' })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
    type: Report,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'S3 file path for the report',
        },
        originalFilename: {
          type: 'string',
          description: 'Original filename of the uploaded file',
        },
        fileSize: {
          type: 'number',
          description: 'Size of the file in bytes',
        },
      },
      required: ['filePath'],
    },
    description: 'S3 file path and metadata for the report',
  })
  @Post()
  async createReport(
    @Body('filePath') filePath: string,
    @Body('originalFilename') originalFilename: string,
    @Body('fileSize') fileSize: number,
    @Req() request: RequestWithUser,
  ): Promise<Report> {
    const userId = this.extractUserId(request);
    return this.reportsService.saveReport(filePath, userId, originalFilename, fileSize);
  }

  private extractUserId(request: RequestWithUser): string {
    // The user object is attached to the request by our middleware
    const user = request.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('User ID not found in request');
    }

    return user.sub;
  }
}
