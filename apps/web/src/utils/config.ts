import z from 'zod';

const isServer = typeof window === 'undefined';

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),

  PORT: z.coerce.number().min(0).max(65535).optional().default(3100),

  NEXT_PUBLIC_API_URL: z.url().default('http://localhost:3101'),
  NEXT_PUBLIC_WEB_URL: z.url().default('http://localhost:3100'),
  NEXT_PUBLIC_ADMIN_URL: z.url().default('http://localhost:3200'),

  STATIC_API_KEY: isServer ? z.string().min(1) : z.string().optional().default(''),
});

export const {
  NODE_ENV,
  PORT,
  NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_ADMIN_URL,
  STATIC_API_KEY,
} = schema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL,
  STATIC_API_KEY: process.env.STATIC_API_KEY,
});
