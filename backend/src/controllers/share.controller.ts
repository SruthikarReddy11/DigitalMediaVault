import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ShareService } from '../services/share.service';
import { StorageFactory } from '../storage/StorageFactory';

export class ShareController {
  /**
   * POST /api/share
   * Create a new share link
   */
  public static async createShareLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const share = await ShareService.createShareLink(req.user!, req.body);
      res.status(201).json({
        success: true,
        data: share,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/share/my-links
   * List all share links for user
   */
  public static async getUserShareLinks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const fileId = req.query.fileId as string | undefined;
      const folderId = req.query.folderId as string | undefined;
      const status = req.query.status as any;

      const links = await ShareService.getUserShareLinks(req.user!, {
        fileId,
        folderId,
        status,
      });

      res.json({
        success: true,
        data: links,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/share/:id/logs
   * View access logs for share link
   */
  public static async getShareLinkLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const shareLinkId = String(req.params.id);
      const result = await ShareService.getShareLinkLogs(shareLinkId, req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/share/:id/revoke
   * Revoke share link
   */
  public static async revokeShareLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const shareLinkId = String(req.params.id);
      const updated = await ShareService.revokeShareLink(shareLinkId, req.user!);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/share/:id/restore
   * Restore revoked share link
   */
  public static async restoreShareLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const shareLinkId = String(req.params.id);
      const updated = await ShareService.restoreShareLink(shareLinkId, req.user!);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/share/:id
   * Permanently delete share link
   */
  public static async deleteShareLink(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const shareLinkId = String(req.params.id);
      const result = await ShareService.deleteShareLink(shareLinkId, req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/share/public/:token
   * Public: Inspect shared link
   */
  public static async getPublicShare(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const password = (req.headers['x-share-password'] || req.query.password) as string | undefined;

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await ShareService.getPublicShare(token, password, { ip, userAgent });
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/share/public/:token/unlock
   * Public: Verify password
   */
  public static async unlockPublicShare(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const password = req.body.password;

      const result = await ShareService.unlockPublicShare(token, password);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/share/public/:token/download/:fileId?
   * Public: Download shared file
   */
  public static async downloadSharedFile(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const fileId = req.params.fileId ? String(req.params.fileId) : undefined;
      const password = (req.headers['x-share-password'] || req.query.password || req.query.pwd) as string | undefined;

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const file = await ShareService.getPublicFileForDownload(token, fileId, password, {
        ip,
        userAgent,
      });

      const storage = StorageFactory.getStorage();
      const { stream } = await storage.getReadStream(file.storageKey);

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(file.originalName)}"`
      );
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', Number(file.size));

      stream.pipe(res);
    } catch (err: any) {
      const token = String(req.params.token);
      const isHtmlNav =
        !req.xhr &&
        !req.headers['x-requested-with'] &&
        (req.headers['accept']?.includes('text/html') || !req.headers['accept']?.includes('application/json'));

      if (isHtmlNav && token) {
        const origin = (process.env.CORS_ORIGIN || 'https://digital-media-vault.vercel.app').split(',')[0].trim();
        const code = err.code || (err.statusCode === 403 ? 'DOWNLOAD_LIMIT_REACHED' : 'DOWNLOAD_ERROR');
        return res.redirect(`${origin}/share/${token}?error=${encodeURIComponent(code)}&msg=${encodeURIComponent(err.message || 'Download error')}`);
      }

      next(err);
    }
  }

  /**
   * GET /api/share/public/:token/stream/:fileId?
   * Public: Stream shared file with range requests support
   */
  public static async streamSharedFile(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const fileId = req.params.fileId ? String(req.params.fileId) : undefined;
      const password = (req.headers['x-share-password'] || req.query.password || req.query.pwd) as string | undefined;

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const file = await ShareService.getPublicFileForStream(token, fileId, password, {
        ip,
        userAgent,
      });

      const storage = StorageFactory.getStorage();
      const fileSize = Number(file.size);
      const range = req.headers.range;

      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize || start > end) {
          res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
          return;
        }

        const chunksize = end - start + 1;
        const { stream } = await storage.getReadStream(file.storageKey, { start, end });

        res.status(206).set({
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunksize),
          'Content-Type': file.mimeType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=3600',
        });

        stream.pipe(res);
      } else {
        const { stream } = await storage.getReadStream(file.storageKey);

        res.status(200).set({
          'Content-Length': String(fileSize),
          'Content-Type': file.mimeType || 'application/octet-stream',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        });

        stream.pipe(res);
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/share/public/:token/qr
   * Public: Get QR code image for token
   */
  public static async getQrCode(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const clientOrigin = req.headers.origin as string | undefined;

      const result = await ShareService.generateQrCode(token, clientOrigin);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/share/public/:token/download-all
   * Public: Download all files in shared album or folder as a ZIP archive
   */
  public static async downloadAllPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const password = (req.headers['x-share-password'] || req.query.password || req.query.pwd) as string | undefined;

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await ShareService.downloadAllFilesZip(token, password, res, { ip, userAgent });
    } catch (err: any) {
      const token = String(req.params.token);
      const isHtmlNav =
        !req.xhr &&
        !req.headers['x-requested-with'] &&
        (req.headers['accept']?.includes('text/html') || !req.headers['accept']?.includes('application/json'));

      if (isHtmlNav && token) {
        const origin = (process.env.CORS_ORIGIN || 'https://digital-media-vault.vercel.app').split(',')[0].trim();
        const code = err.code || (err.statusCode === 403 ? 'DOWNLOAD_LIMIT_REACHED' : 'DOWNLOAD_ERROR');
        return res.redirect(`${origin}/share/${token}?error=${encodeURIComponent(code)}&msg=${encodeURIComponent(err.message || 'Download error')}`);
      }

      next(err);
    }
  }
}
