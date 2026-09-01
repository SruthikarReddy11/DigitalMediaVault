import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(windowMs: number, maxRequests: number, message?: string) {
  const ipStore = new Map<string, RateLimitRecord>();

  // Cleanup old records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipStore.entries()) {
      if (now > record.resetAt) {
        ipStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    let record = ipStore.get(ip);
    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      ipStore.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: message || `Too many requests. Please try again in ${retryAfter} seconds.`,
        },
      });
      return;
    }

    next();
  };
}

// Tiered Pre-configured Rate Limiters
export const globalRateLimiter = createRateLimiter(60 * 1000, 300, 'Too many requests from this IP. Please slow down.');
export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 30, 'Too many authentication attempts. Please try again in 15 minutes.');
export const uploadRateLimiter = createRateLimiter(15 * 60 * 1000, 50, 'Upload rate limit exceeded. Please wait a few minutes before uploading more files.');
