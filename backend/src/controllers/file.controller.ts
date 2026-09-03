import { Response, NextFunction } from 'express';
import fs from 'fs';
import { AuthenticatedRequest } from '../types';
import { FileService } from '../services/file.service';
import { StorageFactory } from '../storage/StorageFactory';
import { prisma } from '../database/prisma';
import { isOwnerOrAdmin } from '../middleware/ownership';

export class FileController {
  public static async uploadFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILES_PROVIDED',
            message: 'Please select one or more files to upload.',
          },
        });
        return;
      }

      const folderId = req.body.folderId || null;
      const uploadedResults = [];

      for (const file of files) {
        try {
          const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
          const result = await FileService.uploadFile(
            req.user!,
            {
              buffer: file.buffer,
              filePath: file.path,
              originalname: originalName,
              mimetype: file.mimetype,
              size: file.size,
            },
            folderId
          );
          uploadedResults.push(result);
        } finally {
          if (file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch {}
          }
        }
      }

      res.status(201).json({
        success: true,
        data: {
          files: uploadedResults,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listFiles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { folderId, fileType, search, favoriteOnly, page, limit, sortBy, sortOrder } = req.query as any;

      const result = await FileService.listFiles(req.user!, {
        folderId: folderId === 'root' ? null : folderId,
        fileType,
        search,
        favoriteOnly: favoriteOnly === 'true',
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result.files,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const file = await FileService.getFile(id, req.user!);
      res.json({
        success: true,
        data: file,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async streamFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const fileId = String(req.params.id);
      const file = await prisma.file.findUnique({ where: { id: fileId } });

      if (!file) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'File not found.' },
        });
        return;
      }

      if (!isOwnerOrAdmin(file.userId, req.user!)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to access this file.' },
        });
        return;
      }

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
          'Cache-Control': 'private, max-age=3600',
        });

        stream.pipe(res);
      } else {
        const { stream } = await storage.getReadStream(file.storageKey);

        res.status(200).set({
          'Content-Length': String(fileSize),
          'Content-Type': file.mimeType || 'application/octet-stream',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'private, max-age=3600',
        });

        stream.pipe(res);
      }
    } catch (err) {
      next(err);
    }
  }

  public static async downloadFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const fileId = String(req.params.id);
      const file = await prisma.file.findUnique({ where: { id: fileId } });

      if (!file) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'File not found.' },
        });
        return;
      }

      if (!isOwnerOrAdmin(file.userId, req.user!)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to download this file.' },
        });
        return;
      }

      const storage = StorageFactory.getStorage();
      const { stream } = await storage.getReadStream(file.storageKey);

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(file.originalName)}"`
      );
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', Number(file.size));

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  public static async renameFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const updated = await FileService.renameFile(id, req.body.name, req.user!);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async moveFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const updated = await FileService.moveFile(id, req.body.folderId, req.user!);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async moveToTrash(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await FileService.moveToTrash(id, req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async restoreFromTrash(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await FileService.restoreFromTrash(id, req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async permanentDelete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await FileService.permanentDelete(id, req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await FileService.getDashboardStats(req.user!);
      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }
}
