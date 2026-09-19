import crypto from 'crypto';

export interface EncryptedPayload {
  encryptedContent: string;
  encryptionIv: string;
  encryptionTag: string;
  encryptionSalt: string;
}

/**
 * Encrypt sensitive note content using AES-256-GCM with a key derived from the note's password.
 */
export function encryptNoteContent(content: string, password: string): EncryptedPayload {
  if (!password || password.trim().length === 0) {
    throw new Error('Password is required for encryption');
  }

  const salt = crypto.randomBytes(16);
  // Derive a strong 256-bit key from the password
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptedContent: encrypted.toString('base64'),
    encryptionIv: iv.toString('base64'),
    encryptionTag: tag.toString('base64'),
    encryptionSalt: salt.toString('base64'),
  };
}

/**
 * Decrypt sensitive note content using AES-256-GCM and the provided password.
 */
export function decryptNoteContent(payload: EncryptedPayload, password: string): string {
  if (!password || password.trim().length === 0) {
    throw new Error('Password is required for decryption');
  }

  const salt = Buffer.from(payload.encryptionSalt, 'base64');
  const iv = Buffer.from(payload.encryptionIv, 'base64');
  const tag = Buffer.from(payload.encryptionTag, 'base64');
  const ciphertext = Buffer.from(payload.encryptedContent, 'base64');

  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
