import { Controller, Get, Patch, Param, Body, Query, ValidationPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Report } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@ApiTags('reports')
@Controller('reports')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({
    status: 200,
    description: 'Returns all reports',
    type: [Report],
  })
  @Get()
  async findAll(): Promise<Report[]> {
    return this.reportsService.findAll();
  }

  @ApiOperation({ summary: 'Get latest reports' })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest reports',
    type: [Report],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of reports to return',
  })
  @Get('latest')
  async findLatest(@Query(ValidationPipe) queryDto: GetReportsQueryDto): Promise<Report[]> {
    return this.reportsService.findLatest(queryDto);
  }

  @ApiOperation({ summary: 'GET report' })
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
  @Get(':id')
  async getReport(
    @Param('id') id: string,
  ): Promise<Report> {
    return this.reportsService.findOne(id);
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
  ): Promise<Report> {
    return this.reportsService.updateStatus(id, updateDto);
  }
}
