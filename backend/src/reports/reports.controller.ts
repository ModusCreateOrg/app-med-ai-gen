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
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('reports')
@ApiTags('reports')
@Auth()
@UsePipes(new ValidationPipe({ transform: true }))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Req() req: any, @Body() createReportDto: CreateReportDto) {
    return this.reportsService.createReport(req.user.sub, createReportDto);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest reports with pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiResponse({ status: 200, type: PaginatedReportsResponseDto })
  async getLatestReports(
    @Query(new ValidationPipe({ transform: true })) query: GetReportsQueryDto,
    @Req() req: any,
  ): Promise<PaginatedReportsResponseDto> {
    try {
      return await this.reportsService.getLatestReports(req.user.sub, query);
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
      return await this.reportsService.getAllReports(req.user.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid request');
    }
  }

  @Get(':id')
  async getReport(@Req() req: any, @Param('id') id: string) {
    return this.reportsService.getReport(req.user.sub, id);
  }

  @Put(':id')
  async updateReport(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportsService.updateReport(req.user.sub, id, updateReportDto);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    try {
      return await this.reportsService.markAsRead(req.user.sub, id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid request');
    }
  }

  @Delete(':id')
  async deleteReport(@Req() req: any, @Param('id') id: string) {
    await this.reportsService.deleteReport(req.user.sub, id);
    return { message: 'Report deleted successfully' };
  }
}
