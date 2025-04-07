import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AwsSecretsService } from './services/aws-secrets.service';
import { AwsBedrockService } from './services/aws-bedrock.service';
import { PerplexityService } from './services/perplexity.service';
import { PerplexityController } from './controllers/perplexity/perplexity.controller';
import { UserController } from './user/user.controller';
import { ReportsModule } from './reports/reports.module';
import { HealthController } from './health/health.controller';
import { AuthMiddleware } from './auth/auth.middleware';
import { BedrockTestModule } from './controllers/bedrock/bedrock.module';
import { BedrockTestController } from './controllers/bedrock/bedrock-test.controller';
import { TextractModule } from './modules/textract.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ReportsModule,
    BedrockTestModule,
    TextractModule,
  ],
  controllers: [
    AppController,
    BedrockTestController,
    HealthController,
    PerplexityController,
    UserController,
  ],
  providers: [AppService, AwsSecretsService, AwsBedrockService, PerplexityService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'test-bedrock', method: RequestMethod.GET },
        { path: 'test-bedrock/health', method: RequestMethod.GET },
        { path: 'test-bedrock/extract-medical-info', method: RequestMethod.POST },
        { path: 'health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
