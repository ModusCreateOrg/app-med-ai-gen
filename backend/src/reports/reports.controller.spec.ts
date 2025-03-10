import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportStatus } from './models/report.model';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockReport = {
    id: '1',
    userId: 'user1',
    title: 'Test Report',
    content: 'Test Content',
    status: ReportStatus.UNREAD,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockService = {
      getLatestReports: jest.fn(),
      markAsRead: jest.fn(),
      getAllReports: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);
  });

  describe('getLatestReports', () => {
    it('should return paginated reports', async () => {
      const mockResponse = {
        items: [mockReport],
        metadata: {
          total: 1,
          page: 1,
          limit: 10,
          hasMore: false,
        },
      };

      jest.spyOn(service, 'getLatestReports').mockResolvedValue(mockResponse);

      const result = await controller.getLatestReports(
        { limit: 10, page: 1 },
        { user: { sub: 'user1' } },
      );

      expect(result.items).toHaveLength(1);
      expect(result.metadata.total).toBe(1);
    });

    it('should handle not found error', async () => {
      jest.spyOn(service, 'getLatestReports').mockRejectedValue(new NotFoundException());

      await expect(
        controller.getLatestReports({ limit: 10, page: 1 }, { user: { sub: 'user1' } }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark report as read', async () => {
      const updatedReport = { ...mockReport, status: ReportStatus.READ };
      jest.spyOn(service, 'markAsRead').mockResolvedValue(updatedReport);

      const result = await controller.markAsRead('1', { user: { sub: 'user1' } });

      expect(result.status).toBe(ReportStatus.READ);
    });
  });
});
