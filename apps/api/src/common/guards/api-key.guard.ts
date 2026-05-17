import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('STATIC_API_KEY');

    if (!apiKeyHeader || apiKeyHeader !== validKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
