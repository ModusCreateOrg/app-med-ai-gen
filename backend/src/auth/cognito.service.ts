import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private verifier: any = null;

  constructor(private configService: ConfigService) {
    this.logger.log('Cognito authentication disabled for development');
  }

  async validateToken(token: string): Promise<any> {
    // Return a mock user for development
    return {
      sub: 'mock-user-123',
      email: 'test@example.com',
      name: 'Test User',
    };
  }
}
