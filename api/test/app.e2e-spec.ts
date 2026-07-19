import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;
  const email = `e2e_${Date.now()}@test.dev`;
  const password = 'password123';
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user and returns both tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        username: 'e2e',
        consent: true,
        birthDate: '2000-01-01',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('rejects registration without consent (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `no-consent-${email}`,
        password,
        username: 'e2e',
        birthDate: '2000-01-01',
      })
      .expect(400);
  });

  it('rejects an under-15 registration without parental consent (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `teen-${email}`,
        password,
        username: 'teen',
        consent: true,
        birthDate: '2012-01-01',
      })
      .expect(400);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    accessToken = res.body.accessToken;
    expect(accessToken).toBeDefined();
  });

  it('returns the profile without the password for a valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(email);
    expect(res.body.password).toBeUndefined();
  });

  it('rejects /me without a token (401)', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('rejects an unknown field (400 forbidNonWhitelisted)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password, unexpected: true })
      .expect(400);
  });

  it('deletes the account (204)', async () => {
    await request(app.getHttpServer())
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
  });

  it('cannot log in after account deletion (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(401);
  });
});
