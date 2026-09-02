import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';
import { IStorageService, StorageReadStreamOptions, StorageSaveOptions } from './IStorageService';
import { v4 as uuidv4 } from 'uuid';

const pump = promisify(pipeline);

// Block executable extensions that could lead to remote code execution if misconfigured
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

export class LocalStorageService implements IStorageService {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
    this.ensureDirectoryExists(this.rootDir);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Strictly resolves storage key within rootDir, preventing path traversal attacks.
   */
  private getSafeAbsolutePath(storageKey: string): string {
    const resolvedRoot = path.resolve(this.rootDir);
    // Remove null bytes and normalize slashes
    const sanitizedKey = storageKey.replace(/\0/g, '').replace(/\\/g, '/');
    const fullPath = path.resolve(resolvedRoot, sanitizedKey);

    // Canonical path verification
    const rel = path.relative(resolvedRoot, fullPath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error('Access denied: Path traversal detected.');
    }

    return fullPath;
  }

  /**
   * Sanitizes file extension and neutralizes executable scripts.
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

  async save(
    data: Buffer | Readable,
    options: StorageSaveOptions
  ): Promise<{ storageKey: string; size: number; checksum?: string }> {
    const safeCategory = (options.category || 'other').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeUserId = options.userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const extension = this.sanitizeExtension(options.originalName);
    const fileId = uuidv4();
    const fileName = `${fileId}${extension}`;

    // Relative storage key: users/:userId/:category/:fileName
    const relativeDir = path.join('users', safeUserId, safeCategory);
    const storageKey = path.join(relativeDir, fileName).replace(/\\/g, '/');

    const targetDir = path.resolve(this.rootDir, relativeDir);
    this.ensureDirectoryExists(targetDir);

    const fullPath = this.getSafeAbsolutePath(storageKey);
    const hash = crypto.createHash('sha256');

    if (Buffer.isBuffer(data)) {
      let finalBuffer = data;
      if (extension === '.svg' || options.mimeType === 'image/svg+xml') {
        finalBuffer = this.sanitizeSvg(data);
      }

      hash.update(finalBuffer);
      await fs.promises.writeFile(fullPath, finalBuffer);
      return {
        storageKey,
        size: finalBuffer.length,
        checksum: hash.digest('hex'),
      };
    } else {
      let totalBytes = 0;
      const chunks: Buffer[] = [];

      // For streams, calculate hash and check if svg
      const writeStream = fs.createWriteStream(fullPath);

      data.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length;
        hash.update(chunk);
      });

      await pump(data, writeStream);

      return {
        storageKey,
        size: totalBytes,
        checksum: hash.digest('hex'),
      };
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      const fullPath = this.getSafeAbsolutePath(storageKey);
      await fs.promises.access(fullPath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getReadStream(
    storageKey: string,
    options?: StorageReadStreamOptions
  ): Promise<{ stream: Readable; size: number }> {
    const fullPath = this.getSafeAbsolutePath(storageKey);
    const stat = await fs.promises.stat(fullPath);

    const streamOptions: { start?: number; end?: number } = {};
    if (options?.start !== undefined) streamOptions.start = options.start;
    if (options?.end !== undefined) streamOptions.end = options.end;

    const stream = fs.createReadStream(fullPath, streamOptions);
    return {
      stream,
      size: stat.size,
    };
  }

  async getBuffer(storageKey: string): Promise<Buffer> {
    const fullPath = this.getSafeAbsolutePath(storageKey);
    return fs.promises.readFile(fullPath);
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      const fullPath = this.getSafeAbsolutePath(storageKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Failed to delete file at ${storageKey}:`, err);
      return false;
    }
  }

  async getTotalStorageUsage(userId?: string): Promise<number> {
    const targetDir = userId
      ? path.resolve(this.rootDir, 'users', userId.replace(/[^a-zA-Z0-9_-]/g, ''))
      : this.rootDir;

    if (!fs.existsSync(targetDir)) {
      return 0;
    }

    const calculateDirSize = async (dir: string): Promise<number> => {
      let total = 0;
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          total += await calculateDirSize(entryPath);
        } else if (entry.isFile()) {
          const stats = await fs.promises.stat(entryPath);
          total += stats.size;
        }
      }
      return total;
    };

    try {
      return await calculateDirSize(targetDir);
    } catch {
      return 0;
    }
  }
}
