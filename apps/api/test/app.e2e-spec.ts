import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as http from 'http';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    const httpServer = app.getHttpServer() as http.Server;
    return request(httpServer)
      .get('/health')
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('ok', true);
        expect(res.body).toHaveProperty('ts');
      });
  });

  it('/health/db (GET)', () => {
    const httpServer = app.getHttpServer() as http.Server;
    return request(httpServer)
      .get('/health/db')
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('ok', true);
        expect(res.body).toHaveProperty('latencyMs');
        expect(typeof (res.body as { latencyMs: number }).latencyMs).toBe(
          'number',
        );
      });
  });
});
