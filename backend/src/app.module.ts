import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AwsSecretsService } from './services/aws-secrets.service';
import { PerplexityService } from './services/perplexity.service';
import { PerplexityController } from './controllers/perplexity/perplexity.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AuthModule,
  ],
  controllers: [AppController, PerplexityController],
  providers: [AppService, AwsSecretsService, PerplexityService],
})
export class AppModule {}
