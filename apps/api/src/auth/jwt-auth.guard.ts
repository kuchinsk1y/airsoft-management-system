import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JWT_SECRET } from '../utils/config';

interface JwtPayload {
  sub: string;
  type?: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
  cookies: {
    access_token?: string;
  };
}

interface JwtServiceInterface {
  verifyAsync(token: string, options: { secret: string }): Promise<unknown>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    let token: string | undefined;

    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && request.cookies?.access_token) {
      token = request.cookies.access_token;
    }

    if (isPublic) {
      if (!token) return true;
      try {
        const payload = (await (
          this.jwtService as JwtServiceInterface
        ).verifyAsync(token, {
          secret: JWT_SECRET,
        })) as JwtPayload;

        if (payload.type && payload.type !== 'access') {
          return true;
        }

        const userId = parseInt(payload.sub, 10);
        if (isNaN(userId)) {
          return true;
        }

        request.user = { userId };
      } catch {
        // Ignore JWT errors, continue with unauthenticated request
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('TOKEN_REQUIRED');
    }

    try {
      const payload = (await (
        this.jwtService as JwtServiceInterface
      ).verifyAsync(token, {
        secret: JWT_SECRET,
      })) as JwtPayload;

      if (payload.type && payload.type !== 'access') {
        throw new UnauthorizedException('INVALID_TOKEN_TYPE');
      }

      const userId = parseInt(payload.sub, 10);
      if (isNaN(userId)) {
        this.logger.warn(`Invalid user ID in token: ${payload.sub}`);
        throw new UnauthorizedException('INVALID_TOKEN_PAYLOAD');
      }

      request.user = {
        userId,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      if (error instanceof Error) {
        this.logger.error(
          `JWT verification failed: ${error.message}`,
          error.stack,
          `${request.method} ${request.url}`,
        );
      }

      throw new UnauthorizedException('INVALID_TOKEN');
    }
  }
}
