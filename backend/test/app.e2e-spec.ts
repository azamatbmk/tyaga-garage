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

  it('/api/garage (GET) requires a session', async () => {
    const anonymous = await request(app.getHttpServer()).get('/api/garage');
    expect(anonymous.status).toBe(401);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ staffId: 'u-senior-dispatcher', password: 'tyaga-demo' });
    expect(login.status).toBe(201);
    const cookie = login.headers['set-cookie'];
    expect(cookie).toBeTruthy();

    const response = await request(app.getHttpServer())
      .get('/api/garage')
      .set('Cookie', cookie!);
    expect(response.status).toBe(200);
    expect(response.body.fleet).toHaveLength(9);
    expect(response.body.branches).toHaveLength(9);
  });

  it('/api/garage/export (GET)', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ staffId: 'u-senior-dispatcher', password: 'tyaga-demo' });
    const cookie = login.headers['set-cookie'];
    const response = await request(app.getHttpServer())
      .get('/api/garage/export')
      .set('Cookie', cookie!)
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
      'tyaga-2026-09-12.xlsx',
    );
    expect(response.body.subarray(0, 2).toString()).toBe('PK');
  });

  afterEach(async () => {
    await app.close();
  });
});
