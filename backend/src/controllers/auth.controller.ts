import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { config } from '../config';

const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? ('none' as const) : ('lax' as const),
  maxAge: config.session.maxAgeDays * 24 * 60 * 60 * 1000,
  path: '/',
};

export class AuthController {
  public static async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { user, token, expiresAt } = await AuthService.register(req.body, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.cookie(config.session.cookieName, token, cookieOptions);

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
          expiresAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { user, token, expiresAt } = await AuthService.login(req.body, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.cookie(config.session.cookieName, token, cookieOptions);

      res.json({
        success: true,
        data: {
          user,
          token,
          expiresAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await AuthService.logout(req.sessionId, req.user?.id, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.clearCookie(config.session.cookieName, { path: '/' });

      res.json({
        success: true,
        data: { message: 'Logged out successfully.' },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated.',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updatedUser = await AuthService.updateProfile(req.user!.id, req.body);

      res.json({
        success: true,
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No image file uploaded.',
          },
        });
        return;
      }

      const updatedUser = await AuthService.uploadAvatar(req.user!.id, req.file);

      res.json({
        success: true,
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async removeAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updatedUser = await AuthService.removeAvatar(req.user!.id);

      res.json({
        success: true,
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = String(req.params.userId);
      const { stream, mimeType } = await AuthService.getAvatarStream(userId);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  public static async getSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await AuthService.getUserSessions(req.user!.id, req.sessionId);
      res.json({
        success: true,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async revokeOtherSessions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.revokeOtherSessions(req.user!.id, req.sessionId);
      res.json({
        success: true,
        data: {
          message: `Revoked ${result.count} other active session(s).`,
          count: result.count,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
