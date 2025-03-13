import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ValidationPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { Report, ReportStatus } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({
    status: 200,
    description: 'Returns all reports',
    type: [Report]
  })
  @Get()
  async findAll(): Promise<Report[]> {
    return this.reportsService.findAll();
  }

  @ApiOperation({ summary: 'Get latest reports' })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest reports',
    type: [Report]
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of reports to return'
  })
  @Get('latest')
  async findLatest(@Query(ValidationPipe) queryDto: GetReportsQueryDto): Promise<Report[]> {
    return this.reportsService.findLatest(queryDto);
  }

  @ApiOperation({ summary: 'Update report status' })
  @ApiResponse({
    status: 200,
    description: 'Report status updated successfully',
    type: Report
  })
  @ApiResponse({
    status: 404,
    description: 'Report not found'
  })
  @ApiParam({
    name: 'id',
    description: 'Report ID'
  })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateReportStatusDto
  ): Promise<Report> {
    return this.reportsService.updateStatus(id, updateDto);
  }
}
