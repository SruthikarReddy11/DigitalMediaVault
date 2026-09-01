import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

describe('Security & Multi-User Ownership Tests', () => {
  let userACookie: any;
  let userBCookie: any;
  let adminCookie: any;
  let userAFileId: string;

  beforeAll(async () => {
    // 1. Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Alpha',
        username: `alpha_${Date.now()}`,
        email: `alpha_${Date.now()}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    userACookie = resA.headers['set-cookie'];

    // 2. Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Beta',
        username: `beta_${Date.now()}`,
        email: `beta_${Date.now()}@example.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    userBCookie = resB.headers['set-cookie'];

    // 3. Ensure Admin exists and login
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    await prisma.user.upsert({
      where: { email: 'admin@library.local' },
      update: { passwordHash: adminPasswordHash, role: Role.ADMIN },
      create: {
        name: 'System Administrator',
        username: 'admin',
        email: 'admin@library.local',
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });

    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'admin@library.local',
        password: 'AdminPass123!',
      });
    adminCookie = resAdmin.headers['set-cookie'];

    // 4. User A uploads a private test file
    const uploadRes = await request(app)
      .post('/api/files/upload')
      .set('Cookie', userACookie)
      .attach('files', Buffer.from('Confidential data for User Alpha'), 'alpha_secret.txt');

    expect(uploadRes.status).toBe(201);
    userAFileId = uploadRes.body.data.files[0].id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'alpha_',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'beta_',
        },
      },
    });
    await prisma.$disconnect();
  });

  it('Owner (User A) can view and stream their own file (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/files/${userAFileId}`)
      .set('Cookie', userACookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.originalName).toBe('alpha_secret.txt');

    const streamRes = await request(app)
      .get(`/api/files/${userAFileId}/stream`)
      .set('Cookie', userACookie);

    expect(streamRes.status).toBe(200);
    const content = streamRes.text || (streamRes.body ? streamRes.body.toString('utf-8') : '');
    expect(content).toContain('Confidential data for User Alpha');
  });

  it('Non-owner (User B) CANNOT view User A file (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/files/${userAFileId}`)
      .set('Cookie', userBCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Non-owner (User B) CANNOT stream User A file (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/files/${userAFileId}/stream`)
      .set('Cookie', userBCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Non-owner (User B) CANNOT rename or delete User A file (403 Forbidden)', async () => {
    const renameRes = await request(app)
      .patch(`/api/files/${userAFileId}/rename`)
      .set('Cookie', userBCookie)
      .send({ name: 'Hacked.txt' });

    expect(renameRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/files/${userAFileId}/trash`)
      .set('Cookie', userBCookie);

    expect(deleteRes.status).toBe(403);
  });

  it('ADMIN CAN view and stream any user file (200 OK)', async () => {
    const res = await request(app)
      .get(`/api/files/${userAFileId}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.originalName).toBe('alpha_secret.txt');
  });

  it('Non-admin (User B) CANNOT access Admin endpoints (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', userBCookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('ADMIN CAN access Admin endpoints (200 OK)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.files).toBeDefined();
    expect(res.body.data.storage).toBeDefined();
  });
});
