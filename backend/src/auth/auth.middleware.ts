import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

// Extend the Express Request interface to include the user property
export interface RequestWithUser extends Request {
  user?: {
    sub: string;
    email?: string;
    groups?: string[];
    [key: string]: any;
  } | null;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: RequestWithUser, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Verify the JWT token
        const decoded = jwt.verify(token, this.configService.get('JWT_SECRET') || 'dev-secret');

        // Attach the decoded user to the request
        req.user = {
          sub: decoded.sub as string,
        };
      } catch (error) {
        // If token verification fails, set user to null
        req.user = null;
      }
    } else {
      // No token provided
      req.user = null;
    }

    next();
  }
}
