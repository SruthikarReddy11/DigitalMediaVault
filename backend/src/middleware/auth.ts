import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../database/prisma';
import { hashToken } from '../utils/security';
import { config } from '../config';
import { AuthenticatedRequest } from '../types';
import { AuthService } from '../services/auth.service';

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

    if (!token) {
      return next();
    }

    const tokenHash = hashToken(token);

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
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session) {
      return next();
    }

    if (new Date() > session.expiresAt) {
      // Session expired, remove it asynchronously
      prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return next();
    }

    if (!session.user.isActive) {
      return next();
    }

    // Update lastUsedAt periodically
    prisma.session
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    req.user = AuthService.formatUser(session.user);
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
