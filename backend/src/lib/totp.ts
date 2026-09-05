import crypto from 'crypto';
import QRCode from 'qrcode';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateSecret(length = 20): string {
  return base32Encode(crypto.randomBytes(length));
}

export function generateTOTP(secret: string, timeStep = 30, time = Date.now()): string {
  const key = base32Decode(secret);
  const counter = Math.floor(time / 1000 / timeStep);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, '0');
}

export function verifyTOTP(token: string, secret: string, window = 1, timeStep = 30): boolean {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) return false;

  const currentTime = Date.now();
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const checkTime = currentTime + errorWindow * timeStep * 1000;
    if (generateTOTP(secret, timeStep, checkTime) === trimmed) {
      return true;
    }
  }
  return false;
}

export function getOtpAuthUrl(issuer: string, accountName: string, secret: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export async function generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
  return await QRCode.toDataURL(otpAuthUrl, {
    width: 250,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
