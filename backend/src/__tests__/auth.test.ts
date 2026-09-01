import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/prisma';

describe('Authentication & Session API Tests', () => {
  const testUser = {
    name: 'Auth Test User',
    username: `authtest_${Date.now()}`,
    email: `authtest_${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'authtest_' } },
    });
    await prisma.$disconnect();
  });

  it('should successfully register a new user and set HTTP-only cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.passwordHash).toBeUndefined(); // ensure hash is never exposed

    // Verify cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/pdl_session=/);
  });

  it('should reject duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        ...testUser,
        username: `diffuser_${Date.now()}`,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('should reject registration with invalid password (no uppercase/number)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Pass',
        username: `weak_${Date.now()}`,
        email: `weak_${Date.now()}@example.com`,
        password: 'weakpassword',
        confirmPassword: 'weakpassword',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testUser.email,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should login successfully with valid credentials and return me info', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testUser.email,
        password: testUser.password,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    const cookie = loginRes.headers['set-cookie'];

    // Verify /api/auth/me using cookie
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should logout and clear session', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testUser.email,
        password: testUser.password,
      });

    const cookie = loginRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);

    // Verify subsequent me request fails
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', logoutRes.headers['set-cookie']);

    expect(meRes.status).toBe(401);
  });
});
