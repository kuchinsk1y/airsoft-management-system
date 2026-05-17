import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node -r tsconfig-paths/register src/seeds/seed-products.ts && ts-node -r tsconfig-paths/register src/seeds/seed-events.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
