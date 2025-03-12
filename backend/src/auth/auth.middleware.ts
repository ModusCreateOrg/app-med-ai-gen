import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers['x-amzn-oidc-data'] as string;

    if (token) {
      try {
        const user = await this.jwtService.verifyToken(token);
        req.user = user;
      } catch (error: unknown) {
        // Just log the error but don't block the request
        // This allows routes without @UseGuards(JwtAuthGuard) to still work
        console.error('Token validation failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    next();
  }
}
