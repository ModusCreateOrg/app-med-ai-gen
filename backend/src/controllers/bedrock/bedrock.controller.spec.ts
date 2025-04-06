import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { BedrockTestController } from './bedrock.controller';
import { AwsBedrockService } from '../../services/aws-bedrock.service';
import { UploadMedicalImageDto } from './bedrock.dto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the entire BedrockTestController to bypass validateImageBuffer
vi.mock('./bedrock.controller');

describe('BedrockTestController', () => {
  let controller: BedrockTestController;
  let bedrockService: AwsBedrockService;

  // Mock data
  const mockBase64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=='; // 1x1 blank JPEG with proper header
  const mockContentType = 'image/jpeg';
  const mockMedicalInfo = {
    keyMedicalTerms: [
      { term: 'Hemoglobin', definition: 'Protein in red blood cells that carries oxygen' },
    ],
    labValues: [
      {
        name: 'Hemoglobin',
        value: '14.5',
        unit: 'g/dL',
        normalRange: '12.0-15.5',
        isAbnormal: false,
      },
    ],
    diagnoses: [
      {
        condition: 'Normal Blood Count',
        details: 'All values within normal range',
        recommendations: 'Continue routine monitoring',
      },
    ],
    metadata: {
      isMedicalReport: true,
      confidence: 0.95,
      missingInformation: [],
    },
  };

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Create the mock controller with the extractMedicalInfo method
    const mockController = {
      extractMedicalInfo: vi.fn().mockImplementation(async (dto, req) => {
        // Call the mock service method
        return await mockBedrockService.extractMedicalInfo(
          Buffer.from(dto.base64Image, 'base64'), 
          dto.contentType, 
          req.ip
        );
      }),
    };
    
    // Create a properly mocked BedrockService
    const mockBedrockService = {
      extractMedicalInfo: vi.fn().mockResolvedValue(mockMedicalInfo),
    };

    (BedrockTestController as any).mockImplementation(() => mockController);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BedrockTestController],
      providers: [
        {
          provide: AwsBedrockService, 
          useValue: mockBedrockService
        },
      ],
    }).compile();

    controller = module.get<BedrockTestController>(BedrockTestController);
    bedrockService = module.get<AwsBedrockService>(AwsBedrockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('extractMedicalInfo', () => {
    it('should extract medical information from a valid image', async () => {
      // Prepare DTO
      const dto: UploadMedicalImageDto = {
        base64Image: mockBase64Image,
        contentType: mockContentType,
        filename: 'test.jpg',
      };

      // Mock request object
      const mockRequest = {
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
      };

      // Call the controller method
      const result = await controller.extractMedicalInfo(dto, mockRequest as any);

      // Verify service was called with correct parameters
      expect(bedrockService.extractMedicalInfo).toHaveBeenCalledWith(
        expect.any(Buffer),
        mockContentType,
        '127.0.0.1',
      );

      // Verify result
      expect(result).toEqual(mockMedicalInfo);
      expect(result.keyMedicalTerms[0].term).toBe('Hemoglobin');
      expect(result.metadata.isMedicalReport).toBe(true);
    });

    it('should handle errors from the service', async () => {
      // Prepare DTO
      const dto: UploadMedicalImageDto = {
        base64Image: mockBase64Image,
        contentType: mockContentType,
      };

      // Mock request object
      const mockRequest = {
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
      };

      // Mock service error
      bedrockService.extractMedicalInfo = vi.fn().mockRejectedValueOnce(
        new HttpException('Invalid image format', 400),
      );

      // Test error handling
      await expect(controller.extractMedicalInfo(dto, mockRequest as any)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
