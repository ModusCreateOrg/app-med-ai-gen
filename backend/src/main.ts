import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './swagger.config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;

  // Configure JSON body parser with increased limits
  app.use(json({ limit: '3mb' })); // Increased from default 100kb to 3mb

  // Set server timeout to 5 minutes (300,000 ms)
  app.getHttpAdapter().getInstance().timeout = 300000;

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      'https://localhost', // Add this for Capacitor
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Add global prefix 'api' to all routes
  app.setGlobalPrefix('api');

  // Setup Swagger
  setupSwagger(app);

  // Rest of your bootstrap code...
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Medical Reports API')
    .setDescription('API for medical reports application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
