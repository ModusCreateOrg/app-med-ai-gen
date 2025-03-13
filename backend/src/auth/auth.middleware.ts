import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET')
        });

        req.user = {
          id: payload.sub,
          username: payload.username,
          email: payload.email,
          groups: payload.groups || [],
        };
      } catch (error) {
        // If token verification fails, we don't set the user
        // but we also don't block the request - protected routes
        // will be handled by JwtAuthGuard
      }
    }

    next();
  }
}
