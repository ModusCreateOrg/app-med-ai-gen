import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private readonly verifier: any;

  constructor(private readonly configService: ConfigService) {
    this.verifier = CognitoJwtVerifier.create({
      userPoolId: this.configService.get<string>('aws.cognito.userPoolId'),
      clientId: this.configService.get<string>('aws.cognito.clientId'),
      tokenUse: 'access',
    });
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = await this.verifier.verify(token);
      return payload;
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      return null;
    }
  }
}
