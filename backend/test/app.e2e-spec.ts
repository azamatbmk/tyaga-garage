import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('Garage API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ ok: true, service: 'tyaga-api' });
  });

  it('/api/garage (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/api/garage');
    expect(response.status).toBe(200);
    expect(response.body.fleet).toHaveLength(12);
    expect(response.body.requests).toHaveLength(3);
  });

  it('/api/garage/export (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/garage/export')
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(response.headers['content-disposition']).toContain(
      'tyaga-smena-2026-09-12.xlsx',
    );
    expect(response.body.subarray(0, 2).toString()).toBe('PK');
  });

  afterEach(async () => {
    await app.close();
  });
});
