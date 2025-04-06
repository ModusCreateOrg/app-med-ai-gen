import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { BedrockTestController } from './bedrock.controller';
import { AwsBedrockService } from '../../services/aws-bedrock.service';
import { UploadMedicalImageDto } from './bedrock.dto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('BedrockTestController', () => {
  let controller: BedrockTestController;
  let bedrockService: AwsBedrockService;

  // Mock data
  const mockBase64Image = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 transparent GIF
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
    // Create mock service with spy for extractMedicalInfo
    const mockBedrockService = {
      extractMedicalInfo: vi.fn().mockResolvedValue(mockMedicalInfo),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BedrockTestController],
      providers: [
        {
          provide: AwsBedrockService,
          useValue: mockBedrockService,
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
      vi.spyOn(bedrockService, 'extractMedicalInfo').mockRejectedValueOnce(
        new HttpException('Invalid image format', 400),
      );

      // Test error handling
      await expect(controller.extractMedicalInfo(dto, mockRequest as any)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
