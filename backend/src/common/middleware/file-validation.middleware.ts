import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class FileValidationMiddleware implements NestMiddleware {
  // Allowed MIME types
  private readonly allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  // Size limits in bytes with proper type definition
  private readonly sizeLimits: Record<string, number> = {
    'application/pdf': 10 * 1024 * 1024, // 10MB
    'image/jpeg': 5 * 1024 * 1024, // 5MB
    'image/png': 5 * 1024 * 1024, // 5MB
  };

  use(req: Request, res: Response, next: NextFunction) {
    if (!req.file) {
      return next();
    }

    const file = req.file as Express.Multer.File;

    // Validate MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file format. Allowed formats are: PDF, JPEG, and PNG.`,
      );
    }

    // Validate file size
    const sizeLimit = this.sizeLimits[file.mimetype];
    if (file.size > sizeLimit) {
      const limitInMB = sizeLimit / (1024 * 1024);
      throw new BadRequestException(
        `File size exceeds the limit. Maximum allowed size for ${file.mimetype} is ${limitInMB}MB.`,
      );
    }

    next();
  }
}
