import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  NotFoundException,
  ValidationPipe,
  UsePipes,
  Patch,
  Query,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { GetLatestReportsQuery } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.query.dto';
import { PaginatedReportsResponseDto } from './dto/report.response.dto';

@Controller('reports')
@UsePipes(new ValidationPipe({ transform: true }))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Req() req: any, @Body() createReportDto: CreateReportDto) {
    return this.reportsService.createReport('mock-user-123', createReportDto);
  }

  @Get('latest')
  async getLatestReports(
    @Query(new ValidationPipe({ transform: true })) query: GetReportsQueryDto,
    @Req() req: any,
  ): Promise<PaginatedReportsResponseDto> {
    try {
      return await this.reportsService.getLatestReports('mock-user-123', query);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid request');
    }
  }

  @Get()
  async getAllReports(@Req() req: any) {
    try {
      return await this.reportsService.getAllReports('mock-user-123');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid request');
    }
  }

  @Get(':id')
  async getReport(@Req() req: any, @Param('id') id: string) {
    return this.reportsService.getReport('mock-user-123', id);
  }

  @Put(':id')
  async updateReport(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportsService.updateReport('mock-user-123', id, updateReportDto);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    try {
      return await this.reportsService.markAsRead('mock-user-123', id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid request');
    }
  }

  @Delete(':id')
  async deleteReport(@Req() req: any, @Param('id') id: string) {
    await this.reportsService.deleteReport('mock-user-123', id);
    return { message: 'Report deleted successfully' };
  }
}
