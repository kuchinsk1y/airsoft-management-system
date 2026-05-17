import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  app() {
    return { ok: true, ts: new Date().toISOString() };
  }

  @Public()
  @Get('db')
  async db() {
    const t0 = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1 AS ping`;
      return { ok: true, latencyMs: Date.now() - t0 };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'unknown';
      throw new ServiceUnavailableException({
        ok: false,
        error: 'DB unavailable',
        message,
      });
    }
  }
}
