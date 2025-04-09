import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AwsSecretsService } from './services/aws-secrets.service';
import { PerplexityService } from './services/perplexity.service';
import { PerplexityController } from './controllers/perplexity/perplexity.controller';
import { UserController } from './user/user.controller';
import { ReportsModule } from './reports/reports.module';
import { HealthController } from './health/health.controller';
import { AuthMiddleware } from './auth/auth.middleware';
import { DocumentProcessorModule } from './document-processor/document-processor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ReportsModule,
    DocumentProcessorModule,
  ],
  controllers: [AppController, HealthController, PerplexityController, UserController],
  providers: [AppService, AwsSecretsService, PerplexityService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('document-processor/(.*)')
      .forRoutes('*');
  }
}
