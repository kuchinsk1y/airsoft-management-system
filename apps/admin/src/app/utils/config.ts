import dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),

  PORT: z.coerce.number().min(0).max(65535).optional().default(3200),

  NEXT_PUBLIC_API_URL: z.string().url(),

  NEXT_PUBLIC_API_KEY: z.string().min(1),

  NEXT_PUBLIC_WEB_URL: z.string().url().optional().default('https://strike-shop-web.vercel.app'),
});

export const { NODE_ENV, PORT, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY, NEXT_PUBLIC_WEB_URL } =
  schema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  });
