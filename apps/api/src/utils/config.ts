import * as dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),

  PORT: z.coerce.number().min(0).max(65535),

  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_URL: z.string().optional(),
  PRISMA_POOL_MAX: z.coerce.number().int().min(1).max(50).default(3),
  PRISMA_POOL_IDLE_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(120000)
    .default(5000),
  PRISMA_POOL_CONNECTION_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(120000)
    .default(5000),

  JWT_SECRET: z.string().min(32),

  SENDGRID_API_KEY: z.string().optional().default(''),

  SENDGRID_FROM_EMAIL: z.string().optional().default(''),

  FRONTEND_BASE_URL: z.string().url(),

  ADMIN_BASE_URL: z.string().url(),

  CORS_ORIGINS: z
    .string()
    .transform((val) => val.split(',').map((url) => url.trim())),

  MONGODB_URI: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),

  FACEBOOK_APP_ID: z.string().min(1),
  FACEBOOK_APP_SECRET: z.string().min(1),
  FACEBOOK_CALLBACK_URL: z.string().url(),

  STORAGE_DRIVER: z.enum(['local', 'vercel'] as const),
  APP_BASE_URL: z.string().url(),

  BLOB_READ_WRITE_TOKEN: z.string(),

  PRISMA_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),

  LIQPAY_PUBLIC_KEY: z.string().min(1),
  LIQPAY_PRIVATE_KEY: z.string().min(1),
  PAYMENTS_MODE: z.enum(['mock', 'real']).default('mock'),
  LIQPAY_CALLBACK_URL: z.string().url(),
  LIQPAY_RESULT_URL: z.string().url(),
});

export const {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  DATABASE_POOL_URL,
  PRISMA_POOL_MAX,
  PRISMA_POOL_IDLE_TIMEOUT_MS,
  PRISMA_POOL_CONNECTION_TIMEOUT_MS,
  JWT_SECRET,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  FRONTEND_BASE_URL,
  ADMIN_BASE_URL,
  CORS_ORIGINS,
  MONGODB_URI,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,

  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL,
  STORAGE_DRIVER,
  APP_BASE_URL,
  BLOB_READ_WRITE_TOKEN,
  PRISMA_ENABLED,

  LIQPAY_PUBLIC_KEY,
  LIQPAY_PRIVATE_KEY,
  PAYMENTS_MODE,
  LIQPAY_CALLBACK_URL,
  LIQPAY_RESULT_URL,
} = schema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_POOL_URL: process.env.DATABASE_POOL_URL,
  PRISMA_POOL_MAX: process.env.PRISMA_POOL_MAX,
  PRISMA_POOL_IDLE_TIMEOUT_MS: process.env.PRISMA_POOL_IDLE_TIMEOUT_MS,
  PRISMA_POOL_CONNECTION_TIMEOUT_MS:
    process.env.PRISMA_POOL_CONNECTION_TIMEOUT_MS,
  JWT_SECRET: process.env.JWT_SECRET,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
  FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL,
  ADMIN_BASE_URL: process.env.ADMIN_BASE_URL,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  MONGODB_URI: process.env.MONGODB_URI,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,
  APP_BASE_URL: process.env.APP_BASE_URL,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  PRISMA_ENABLED: process.env.PRISMA_ENABLED,
  LIQPAY_PUBLIC_KEY: process.env.LIQPAY_PUBLIC_KEY,
  LIQPAY_PRIVATE_KEY: process.env.LIQPAY_PRIVATE_KEY,
  PAYMENTS_MODE: process.env.PAYMENTS_MODE,
  LIQPAY_CALLBACK_URL: process.env.LIQPAY_CALLBACK_URL,
  LIQPAY_RESULT_URL: process.env.LIQPAY_RESULT_URL,
});
