import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { S3Service } from '../common/services/s3.service';
import { FileValidationMiddleware } from '../common/middleware/file-validation.middleware';

@Module({
  imports: [
    ConfigModule,
    // Configure Multer to use memory storage for file processing
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, S3Service],
  exports: [ReportsService],
})
export class ReportsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(FileValidationMiddleware)
      .forRoutes({ path: 'reports/upload', method: RequestMethod.POST });
  }
}
