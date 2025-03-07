import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { CognitoService } from './cognito.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly cognitoService: CognitoService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header found');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const payload = await this.cognitoService.validateToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    // Add user info to request object
    request.user = payload;
    return true;
  }
}
