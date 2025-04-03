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

// Add this interface to define the token structure
interface DecodedToken {
  payload: {
    sub: string;
    username?: string;
    email?: string;
    [key: string]: any;
  };
  header: any;
  signature: string;
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
        const decodedToken = jwt.decode(token, { complete: true }) as DecodedToken;

        // Access user info from the payload
        req.user = {
          sub: decodedToken?.payload.sub as string,
          username: decodedToken?.payload.username as string,
        };
      } catch (error) {
        // If token verification fails, set user to null
        console.log('AuthMiddleware error');
        console.log(error);
        req.user = null;
      }
    } else {
      // No token provided
      req.user = null;
    }

    next();
  }
}
