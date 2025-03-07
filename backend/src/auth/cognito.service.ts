import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private verifier;

  constructor(private configService: ConfigService) {
    const userPoolId = this.configService.get<string>('aws.cognito.userPoolId');
    const clientId = this.configService.get<string>('aws.cognito.clientId');

    // Check if required configuration is available
    if (!userPoolId || !clientId) {
      this.logger.error('Missing Cognito configuration. Make sure AWS_COGNITO_USER_POOL_ID and AWS_COGNITO_CLIENT_ID are set.');
      throw new Error('Missing Cognito configuration');
    }

    // Initialize the verifier with non-nullable values
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: userPoolId,
      clientId: clientId,
      tokenUse: 'access', // or 'id'
    });
  }

  async validateToken(token: string): Promise<any> {
    try {
      return await this.verifier.verify(token);
    } catch (error) {
      // Type-safe error handling
      this.logger.error(`Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
