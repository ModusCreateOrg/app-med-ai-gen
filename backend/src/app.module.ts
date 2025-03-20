import { Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AwsSecretsService } from './services/aws-secrets.service';
import { PerplexityService } from './services/perplexity.service';
import { PerplexityController } from './controllers/perplexity/perplexity.controller';
import { UserController } from './user/user.controller';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ReportsModule,
  ],
  controllers: [AppController, PerplexityController, UserController],
  providers: [AppService, AwsSecretsService, PerplexityService],
})
export class AppModule implements NestModule {
  configure() {
    // Add your middleware configuration here if needed
    // If you don't need middleware, you can leave this empty
  }
}
