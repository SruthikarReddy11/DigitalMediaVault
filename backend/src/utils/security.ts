import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSignedResetToken(userId: string, secret: string, expiresInMinutes = 15): string {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySignedResetToken(token: string, secret: string): { userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.userId || !data.expiresAt) return null;
    if (Date.now() > data.expiresAt) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export function createSignedContactsToken(userId: string, secret: string, expiresInMinutes = 60): string {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ userId, scope: 'contacts_vault', expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifySignedContactsToken(token: string, secret: string): { userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.userId || data.scope !== 'contacts_vault' || !data.expiresAt) return null;
    if (Date.now() > data.expiresAt) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

