import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../database/prisma';
import { hashToken } from '../utils/security';
import { config } from '../config';
import { AuthenticatedRequest } from '../types';
import { AuthService } from '../services/auth.service';

interface CachedSession {
  user: any;
  sessionId: string;
  expiresAt: Date;
  cachedAt: number;
  lastTouchTime: number;
}

const sessionCache = new Map<string, CachedSession>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds memory cache
const TOUCH_THROTTLE_MS = 5 * 60 * 1000; // Throttle lastUsedAt writes to once every 5 minutes

export function invalidateSessionCache(tokenHash?: string): void {
  if (tokenHash) {
    sessionCache.delete(tokenHash);
  } else {
    sessionCache.clear();
  }
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.[config.session.cookieName];

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token && req.query?.token) {
      token = String(req.query.token);
    }

    if (!token) {
      return next();
    }

    const tokenHash = hashToken(token);
    const now = Date.now();

    // Check fast in-memory cache first to avoid remote database roundtrips
    const cached = sessionCache.get(tokenHash);
    if (cached && new Date() < cached.expiresAt && (now - cached.cachedAt) < CACHE_TTL_MS) {
      req.user = cached.user;
      req.sessionId = cached.sessionId;

      if (now - cached.lastTouchTime > TOUCH_THROTTLE_MS) {
        cached.lastTouchTime = now;
        prisma.session
          .update({
            where: { id: cached.sessionId },
            data: { lastUsedAt: new Date() },
          })
          .catch(() => {});
      }
      return next();
    }

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatarUrl: true,
            securityPin: true,
            role: true,
            isActive: true,
            mobileNumber: true,
            gender: true,
            dob: true,
            country: true,
            state: true,
            district: true,
            village: true,
            pincode: true,
            occupation: true,
          },
        },
      },
    });

    if (!session) {
      sessionCache.delete(tokenHash);
      return next();
    }

    if (new Date() > session.expiresAt) {
      sessionCache.delete(tokenHash);
      // Session expired, remove it asynchronously
      prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return next();
    }

    if (!session.user.isActive) {
      sessionCache.delete(tokenHash);
      return next();
    }

    const formattedUser = AuthService.formatUser(session.user);
    sessionCache.set(tokenHash, {
      user: formattedUser,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      cachedAt: now,
      lastTouchTime: now,
    });

    // Update lastUsedAt periodically
    prisma.session
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    req.user = formattedUser;
    req.sessionId = session.id;
    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    next();
  }
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to access this resource.',
      },
    });
    return;
  }
  next();
}

export function requireRole(role: Role) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires ${role} role.`,
        },
      });
      return;
    }

    next();
  };
}
