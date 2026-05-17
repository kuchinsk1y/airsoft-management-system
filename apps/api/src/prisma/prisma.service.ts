import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma-client';
import {
  DATABASE_POOL_URL,
  DATABASE_URL,
  PRISMA_POOL_CONNECTION_TIMEOUT_MS,
  PRISMA_POOL_IDLE_TIMEOUT_MS,
  PRISMA_POOL_MAX,
} from '../utils/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }

    const connectionString = DATABASE_POOL_URL || DATABASE_URL;

    const pool = new Pool({
      connectionString,
      max: PRISMA_POOL_MAX,
      idleTimeoutMillis: PRISMA_POOL_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: PRISMA_POOL_CONNECTION_TIMEOUT_MS,
    });

    super({
      adapter: new PrismaPg(pool),
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end().catch(() => undefined);
  }
}
