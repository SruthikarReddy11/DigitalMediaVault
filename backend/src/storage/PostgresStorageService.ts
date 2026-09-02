import { Readable } from 'stream';
import crypto from 'crypto';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../database/prisma';
import { IStorageService, StorageReadStreamOptions, StorageSaveOptions } from './IStorageService';

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

export class PostgresStorageService implements IStorageService {
  /**
   * Sanitizes file extension and neutralizes dangerous scripts.
   */
  private sanitizeExtension(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
    if (!ext || DANGEROUS_EXTENSIONS.has(ext)) {
      return '.bin';
    }
    return ext;
  }

  /**
   * Sanitizes SVG buffer to prevent Stored Cross-Site Scripting (XSS) and XXE attacks.
   */
  private sanitizeSvg(buffer: Buffer): Buffer {
    let content = buffer.toString('utf-8');

    // Remove script tags and embedded scripts
    content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove foreignObject tags
    content = content.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');
    // Remove inline event handlers (onload, onerror, onclick, etc.)
    content = content.replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, '');
    content = content.replace(/\s+on[a-z]+\s*=\s*[^ >]+/gi, '');
    // Remove javascript: and data: pseudo-protocols in URLs
    content = content.replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"');
    content = content.replace(/xlink:href\s*=\s*(['"])javascript:.*?\1/gi, 'xlink:href="#"');
    // Remove DOCTYPE / ENTITY declarations to prevent XXE
    content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
    content = content.replace(/<!ENTITY[^>]*>/gi, '');

    return Buffer.from(content, 'utf-8');
  }

  /**
   * Converts a Readable stream into a complete Buffer.
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async save(
    data: Buffer | Readable,
    options: StorageSaveOptions
  ): Promise<{ storageKey: string; size: number; checksum?: string }> {
    const safeCategory = (options.category || 'other').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeUserId = options.userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const extension = this.sanitizeExtension(options.originalName);
    const fileId = uuidv4();
    const fileName = `${fileId}${extension}`;

    // Standardized storage key: users/:userId/:category/:fileName
    const storageKey = `users/${safeUserId}/${safeCategory}/${fileName}`;

    let buffer = Buffer.isBuffer(data) ? data : await this.streamToBuffer(data);

    if (extension === '.svg' || options.mimeType === 'image/svg+xml') {
      buffer = this.sanitizeSvg(buffer);
    }

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    // Store binary bytea data directly into Postgres
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
    return !!blob;
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
      throw new Error(`File not found in database storage for key: ${storageKey}`);
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
      throw new Error(`File not found in database storage for key: ${storageKey}`);
    }

    return blob.data;
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      await prisma.storageBlob.delete({
        where: { storageKey },
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  async getTotalStorageUsage(userId?: string): Promise<number> {
    try {
      const result = await prisma.storageBlob.aggregate({
        _sum: { size: true },
        where: userId ? { userId } : undefined,
      });
      return Number(result._sum.size || 0);
    } catch {
      return 0;
    }
  }
}
