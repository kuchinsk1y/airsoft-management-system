import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AclGuard } from './common/guards/acl.guard';
import { CORS_ORIGINS, PORT, STORAGE_DRIVER } from './utils/config';

let cachedApp: express.Express;

export async function createApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.enableCors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  if (STORAGE_DRIVER === 'local') {
    expressApp.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  }

  expressApp.use(
    express.json({
      limit: '10mb',
    }),
  );
  expressApp.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const jwtAuthGuard = app.get(JwtAuthGuard);
  const aclGuard = app.get(AclGuard);
  app.useGlobalGuards(jwtAuthGuard, aclGuard);

  await app.init();
  cachedApp = expressApp;

  return cachedApp;
}

async function bootstrap() {
  const expressApp = await createApp();
  expressApp.listen(PORT);
}

void bootstrap();
