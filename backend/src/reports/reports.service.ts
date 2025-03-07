import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportsRepository } from './repositories/reports.repository';
import { Report, CreateReportDto, UpdateReportDto, ReportStatus, GetLatestReportsQuery } from './models/report.model';
import { GetReportsQueryDto } from './dto/get-reports.query.dto';
import { PaginatedReportsResponseDto } from './dto/report.response.dto';

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
    const report = await this.reportsRepository.updateStatus(userId, reportId, ReportStatus.READ);

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async deleteReport(userId: string, reportId: string): Promise<void> {
    const deleted = await this.reportsRepository.delete(userId, reportId);
    if (!deleted) {
      throw new NotFoundException('Report not found');
    }
  }

  async getLatestReports(
    userId: string,
    query: GetReportsQueryDto,
  ): Promise<PaginatedReportsResponseDto> {
    const { limit = 10, page = 1, cursor } = query;

    const [{ items, nextCursor }, total] = await Promise.all([
      this.reportsRepository.findByUser(userId, { limit, cursor }),
      this.reportsRepository.countByUser(userId),
    ]);

    if (!items.length) {
      throw new NotFoundException('No reports found');
    }

    const response: PaginatedReportsResponseDto = {
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      metadata: {
        total,
        page,
        limit,
        hasMore: !!nextCursor,
        ...(nextCursor && { nextCursor }),
      },
    };

    return response;
  }

  async getAllReports(userId: string): Promise<Report[]> {
    const reports = await this.reportsRepository.findByUser(userId);

    if (!reports.length) {
      throw new NotFoundException('No reports found');
    }

    return reports;
  }
}
