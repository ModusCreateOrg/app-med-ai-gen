import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportsRepository } from './repositories/reports.repository';
import { Report, CreateReportDto, UpdateReportDto } from './models/report.model';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async createReport(userId: string, createReportDto: CreateReportDto): Promise<Report> {
    return this.reportsRepository.create(userId, createReportDto);
  }

  async getReports(userId: string): Promise<Report[]> {
    return this.reportsRepository.findByUser(userId);
  }

  async getReport(userId: string, reportId: string): Promise<Report> {
    const report = await this.reportsRepository.findOne(userId, reportId);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async updateReport(userId: string, reportId: string, updateReportDto: UpdateReportDto): Promise<Report> {
    const report = await this.reportsRepository.update(userId, reportId, updateReportDto);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async markAsRead(userId: string, reportId: string): Promise<Report> {
    return this.updateReport(userId, reportId, { read: true });
  }

  async deleteReport(userId: string, reportId: string): Promise<void> {
    const deleted = await this.reportsRepository.delete(userId, reportId);
    if (!deleted) {
      throw new NotFoundException('Report not found');
    }
  }
}
