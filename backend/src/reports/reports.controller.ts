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
  UsePipes
} from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Controller('reports')
@Auth()
@UsePipes(new ValidationPipe({ transform: true }))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Req() req: any, @Body() createReportDto: CreateReportDto) {
    return this.reportsService.createReport(req.user.sub, createReportDto);
  }

  @Get()
  async getReports(@Req() req: any) {
    return this.reportsService.getReports(req.user.sub);
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

  @Put(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.reportsService.markAsRead(req.user.sub, id);
  }

  @Delete(':id')
  async deleteReport(@Req() req: any, @Param('id') id: string) {
    await this.reportsService.deleteReport(req.user.sub, id);
    return { message: 'Report deleted successfully' };
  }
}
