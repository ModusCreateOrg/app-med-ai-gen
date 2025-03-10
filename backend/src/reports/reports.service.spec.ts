import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './repositories/reports.repository';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportStatus } from './models/report.model';

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: ReportsRepository;

  const mockReport = {
    id: '1',
    userId: 'user1',
    title: 'Test Report',
    content: 'Test Content',
    status: ReportStatus.UNREAD,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockReportsRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    findByUser: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByUser: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportsRepository,
          useValue: mockReportsRepository,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    repository = module.get<ReportsRepository>(ReportsRepository);
  });

  describe('createReport', () => {
    it('should create a report', async () => {
      const createReportDto: CreateReportDto = {
        title: 'Test Report',
        content: 'Test Content',
      };

      mockReportsRepository.create.mockResolvedValue(mockReport);

      const result = await service.createReport('user1', createReportDto);

      expect(result).toEqual(mockReport);
      expect(repository.create).toHaveBeenCalledWith('user1', createReportDto);
    });
  });

  describe('getReports', () => {
    it('should return an array of reports', async () => {
      mockReportsRepository.findByUser.mockResolvedValue([mockReport]);

      const result = await service.getReports('user1');

      expect(result).toEqual([mockReport]);
      expect(repository.findByUser).toHaveBeenCalledWith('user1');
    });
  });

  describe('getReport', () => {
    it('should return a report if found', async () => {
      mockReportsRepository.findOne.mockResolvedValue(mockReport);

      const result = await service.getReport('user1', '1');

      expect(result).toEqual(mockReport);
      expect(repository.findOne).toHaveBeenCalledWith('user1', '1');
    });

    it('should throw NotFoundException if report not found', async () => {
      mockReportsRepository.findOne.mockResolvedValue(null);

      await expect(service.getReport('user1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateReport', () => {
    it('should update a report if found', async () => {
      const updateReportDto: UpdateReportDto = { title: 'Updated Title' };
      const updatedReport = { ...mockReport, title: 'Updated Title' };

      mockReportsRepository.update.mockResolvedValue(updatedReport);

      const result = await service.updateReport('user1', '1', updateReportDto);

      expect(result).toEqual(updatedReport);
      expect(repository.update).toHaveBeenCalledWith('user1', '1', updateReportDto);
    });

    it('should throw NotFoundException if report not found', async () => {
      mockReportsRepository.update.mockResolvedValue(null);

      await expect(service.updateReport('user1', '1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark a report as read', async () => {
      const updatedReport = { ...mockReport, status: ReportStatus.READ };
      mockReportsRepository.updateStatus.mockResolvedValue(updatedReport);

      const result = await service.markAsRead('user1', '1');

      expect(result).toEqual(updatedReport);
      expect(repository.updateStatus).toHaveBeenCalledWith('user1', '1', ReportStatus.READ);
    });
  });

  describe('deleteReport', () => {
    it('should delete a report if found', async () => {
      mockReportsRepository.delete.mockResolvedValue(true);

      await service.deleteReport('user1', '1');

      expect(repository.delete).toHaveBeenCalledWith('user1', '1');
    });

    it('should throw NotFoundException if report not found', async () => {
      mockReportsRepository.delete.mockResolvedValue(false);

      await expect(service.deleteReport('user1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLatestReports', () => {
    it('should return paginated reports', async () => {
      const mockPaginatedResponse = {
        items: [mockReport],
        nextCursor: 'nextPageToken',
      };
      const mockCount = 1;

      jest.spyOn(repository, 'findByUser').mockResolvedValue(mockPaginatedResponse);
      jest.spyOn(repository, 'countByUser').mockResolvedValue(mockCount);

      const result = await service.getLatestReports('user1', { limit: 10, page: 1 });

      expect(result.items).toHaveLength(1);
      expect(result.metadata.total).toBe(mockCount);
      expect(result.metadata.hasMore).toBe(true);
    });

    it('should throw NotFoundException when no reports found', async () => {
      jest.spyOn(repository, 'findByUser').mockResolvedValue({ items: [] });
      jest.spyOn(repository, 'countByUser').mockResolvedValue(0);

      await expect(
        service.getLatestReports('user1', { limit: 10, page: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
