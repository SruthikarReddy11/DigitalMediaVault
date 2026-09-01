import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database/prisma';
import { Role } from '@prisma/client';

describe('VAPT & Security Hardening Tests', () => {
  let userCookie: string;
  let userId: string;

  beforeAll(async () => {
    // Register test security user
    const email = `sec_${Date.now()}@library.local`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Security Tester',
        username: `sectest_${Date.now()}`,
        email,
        password: 'SecPassword123!',
        confirmPassword: 'SecPassword123!',
      });

    expect(res.status).toBe(201);
    userId = res.body.data.user.id;
    userCookie = res.headers['set-cookie'];
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  describe('1. Parameter Validation & Injection Defenses', () => {
    it('should reject invalid UUID parameters with 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/files/not-a-valid-uuid')
        .set('Cookie', userCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject SQL injection payloads in UUID path parameter', async () => {
      const res = await request(app)
        .get("/api/files/' OR 1=1 --")
        .set('Cookie', userCookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('2. Security Headers & Information Disclosure', () => {
    it('should include strict security headers in API responses', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['permissions-policy']).toBeDefined();
      expect(res.headers['x-powered-by']).toBeUndefined(); // Suppressed
    });
  });

  describe('3. File Upload Safety & SVG Sanitization', () => {
    it('should successfully upload and sanitize an SVG file', async () => {
      const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <script>alert("XSS")</script>
        <circle cx="50" cy="50" r="40" onload="alert('XSS2')" fill="red"/>
      </svg>`;

      const res = await request(app)
        .post('/api/files/upload')
        .set('Cookie', userCookie)
        .attach('files', Buffer.from(maliciousSvg), 'test-xss.svg');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const uploadedFile = res.body.data.files[0];

      // Download and verify script was sanitized
      const streamRes = await request(app)
        .get(`/api/files/${uploadedFile.id}/stream`)
        .set('Cookie', userCookie);

      expect(streamRes.status).toBe(200);
      const content = streamRes.text || (streamRes.body ? streamRes.body.toString('utf-8') : '');
      expect(content).not.toContain('<script>');
      expect(content).not.toContain('onload=');
    });
  });

  describe('4. Access Control & Authorization (IDOR)', () => {
    it('should prevent non-admin user from accessing admin console', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Cookie', userCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
