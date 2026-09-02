import { Readable } from 'stream';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../database/prisma';
import { config } from '../config';
import { IStorageService, StorageReadStreamOptions, StorageSaveOptions } from './IStorageService';
import { LocalStorageService } from './LocalStorageService';

const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.php',
  '.phtml',
  '.php3',
  '.php4',
  '.php5',
  '.phps',
  '.jsp',
  '.jspx',
  '.asp',
  '.aspx',
  '.cgi',
  '.pl',
  '.py',
  '.vbs',
  '.js',
  '.mjs',
  '.cjs',
  '.htm',
  '.html',
  '.xhtml',
  '.svgz',
]);

// Threshold to protect PostgreSQL & Node.js process RAM from 512MB OOM crashes on Render
const POSTGRES_MAX_BLOB_SIZE = 15 * 1024 * 1024; // 15MB

export class PostgresStorageService implements IStorageService {
  private localStorage: LocalStorageService;

  constructor() {
    this.localStorage = new LocalStorageService(config.storage.localRoot);
  }

  private sanitizeExtension(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
    if (!ext || DANGEROUS_EXTENSIONS.has(ext)) {
      return '.bin';
    }
    return ext;
  }

  private sanitizeSvg(buffer: Buffer): Buffer {
    let content = buffer.toString('utf-8');

    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    content = content.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');
    content = content.replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, '');
    content = content.replace(/\s+on[a-z]+\s*=\s*[^ >]+/gi, '');
    content = content.replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"');
    content = content.replace(/xlink:href\s*=\s*(['"])javascript:.*?\1/gi, 'xlink:href="#"');
    content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
    content = content.replace(/<!ENTITY[^>]*>/gi, '');

    return Buffer.from(content, 'utf-8');
  }

  async save(
    data: Buffer | Readable,
    options: StorageSaveOptions
  ): Promise<{ storageKey: string; size: number; checksum?: string }> {
    // If input is a Readable stream or a large buffer (> 15MB, e.g. 57MB video),
    // save to disk storage via LocalStorageService to prevent 512MB RAM OOM crash on Render
    if (!Buffer.isBuffer(data) || data.length > POSTGRES_MAX_BLOB_SIZE) {
      return this.localStorage.save(data, options);
    }

    const safeCategory = (options.category || 'other').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeUserId = options.userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const extension = this.sanitizeExtension(options.originalName);
    const fileId = uuidv4();
    const fileName = `${fileId}${extension}`;

    const storageKey = `users/${safeUserId}/${safeCategory}/${fileName}`;

    let buffer = data;
    if (extension === '.svg' || options.mimeType === 'image/svg+xml') {
      buffer = this.sanitizeSvg(buffer);
    }

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Small files <= 15MB: store binary bytea data in Postgres
    await prisma.storageBlob.create({
      data: {
        storageKey,
        userId: safeUserId,
        category: safeCategory,
        mimeType: options.mimeType || 'application/octet-stream',
        size: BigInt(buffer.length),
        data: buffer,
        checksum,
      },
    });

    return {
      storageKey,
      size: buffer.length,
      checksum,
    };
  }

  async exists(storageKey: string): Promise<boolean> {
    const blob = await prisma.storageBlob.findUnique({
      where: { storageKey },
      select: { id: true },
    });
    if (blob) return true;
    return this.localStorage.exists(storageKey);
  }

  async getReadStream(
    storageKey: string,
    options?: StorageReadStreamOptions
  ): Promise<{ stream: Readable; size: number; mimeType?: string }> {
    const blob = await prisma.storageBlob.findUnique({
      where: { storageKey },
      select: { data: true, size: true, mimeType: true },
    });

    if (!blob) {
      // Fallback to disk storage stream (for large videos > 15MB)
      return this.localStorage.getReadStream(storageKey, options);
    }

    const totalSize = Number(blob.size);
    let chunkBuffer = blob.data;

    if (options?.start !== undefined || options?.end !== undefined) {
      const start = options.start ?? 0;
      const end = options.end !== undefined ? options.end + 1 : totalSize;
      chunkBuffer = chunkBuffer.subarray(start, end);
    }

    return {
      stream: Readable.from(chunkBuffer),
      size: totalSize,
      mimeType: blob.mimeType || undefined,
    };
  }

  async getBuffer(storageKey: string): Promise<Buffer> {
    const blob = await prisma.storageBlob.findUnique({
      where: { storageKey },
      select: { data: true },
    });

    if (!blob) {
      return this.localStorage.getBuffer(storageKey);
    }

    return blob.data;
  }

  async delete(storageKey: string): Promise<boolean> {
    let deleted = false;
    try {
      await prisma.storageBlob.delete({
        where: { storageKey },
      });
      deleted = true;
    } catch {}

    const diskDeleted = await this.localStorage.delete(storageKey);
    return deleted || diskDeleted;
  }

  async getTotalStorageUsage(userId?: string): Promise<number> {
    try {
      const dbResult = await prisma.storageBlob.aggregate({
        _sum: { size: true },
        where: userId ? { userId } : undefined,
      });
      const dbUsage = Number(dbResult._sum.size || 0);
      const diskUsage = await this.localStorage.getTotalStorageUsage(userId);
      return dbUsage + diskUsage;
    } catch {
      return this.localStorage.getTotalStorageUsage(userId);
    }
  }
}
