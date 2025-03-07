import { Controller, Get, Post, Body } from '@nestjs/common';
import { Auth } from '../auth/auth.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Auth()
  async getReports() {
    return {
      message: 'This is a protected endpoint',
      reports: await this.reportsService.getReports(),
    };
  }
}
