import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { GalleryService } from '../services/gallery.service';

export class GalleryController {
  public static async getTimeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const folderId = req.query.folderId as string | undefined;
      const favoriteOnly = req.query.favoriteOnly === 'true';

      const timeline = await GalleryService.getTimeline(user, {
        folderId: folderId === 'root' ? null : folderId,
        favoriteOnly,
      });

      res.json({ success: true, data: timeline });
    } catch (err) {
      next(err);
    }
  }

  public static async getExif(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const exif = await GalleryService.getExif(user, req.params.id as string);
      res.json({ success: true, data: exif });
    } catch (err) {
      next(err);
    }
  }

  public static async getDuplicates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const duplicates = await GalleryService.detectDuplicates(user);
      res.json({ success: true, data: duplicates });
    } catch (err) {
      next(err);
    }
  }

  public static async downloadZip(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { fileIds } = req.body;
      await GalleryService.downloadPhotosZip(user, fileIds || [], res);
    } catch (err) {
      next(err);
    }
  }
}
