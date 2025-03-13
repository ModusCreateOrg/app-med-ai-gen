import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import axios from 'axios';

interface JWK {
  alg: string;
  e: string;
  kid: string;
  kty: "RSA";
  n: string;
  use: string;
}

interface CognitoJWKS {
  keys: JWK[];
}

interface DecodedToken {
  sub: string;
  email: string;
  'cognito:groups'?: string[];
  exp: number;
  iat: number;
  [key: string]: any;
}

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private jwksCache: { [kid: string]: string } = {};
  private jwksCacheTime = 0;
  private readonly JWKS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private configService: ConfigService) {}

  async verifyToken(token: string): Promise<any> {
    try {
      // Decode the token without verification to get the key ID (kid)
      const decodedToken = jwt.decode(token, { complete: true });

      if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.header || !decodedToken.header.kid) {
        throw new Error('Invalid token format');
      }

      const kid = decodedToken.header.kid;

      // Get the JWKs
      const jwks = await this.getJwks();
      const pem = jwks[kid];

      if (!pem) {
        throw new Error('Invalid token signature');
      }

      // Verify the token
      const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
      const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', 'ai-cognito-medical-reports-user-pool');

      const verified = jwt.verify(token, pem, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
      }) as DecodedToken;

      return {
        id: verified.sub,
        email: verified.email,
        groups: verified['cognito:groups'] || []
      };
    } catch (error: unknown) {
      this.logger.error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async getJwks(): Promise<{ [kid: string]: string }> {
    const now = Date.now();

    // Return cached JWKs if they're still valid
    if (Object.keys(this.jwksCache).length > 0 && now - this.jwksCacheTime < this.JWKS_CACHE_DURATION) {
      return this.jwksCache;
    }

    try {
      const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
      const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID', 'ai-cognito-medical-reports-user-pool');
      const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

      const response = await axios.get<CognitoJWKS>(jwksUrl);

      const jwks: { [kid: string]: string } = {};
      for (const key of response.data.keys) {
        jwks[key.kid] = jwkToPem(key);
      }

      this.jwksCache = jwks;
      this.jwksCacheTime = now;

      return jwks;
    } catch (error: unknown) {
      this.logger.error(`Error fetching JWKs: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to fetch JWKs');
    }
  }
}
