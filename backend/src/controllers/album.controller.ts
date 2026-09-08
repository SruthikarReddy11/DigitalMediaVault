import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AlbumService } from '../services/album.service';

export class AlbumController {
  public static async createAlbum(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const album = await AlbumService.createAlbum(user, req.body);
      res.status(201).json({ success: true, data: album });
    } catch (err) {
      next(err);
    }
  }

  public static async getAlbums(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const albums = await AlbumService.getAlbums(user);
      res.json({ success: true, data: albums });
    } catch (err) {
      next(err);
    }
  }

  public static async getAlbum(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const album = await AlbumService.getAlbum(user, req.params.id as string);
      res.json({ success: true, data: album });
    } catch (err) {
      next(err);
    }
  }

  public static async updateAlbum(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const updated = await AlbumService.updateAlbum(user, req.params.id as string, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteAlbum(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await AlbumService.deleteAlbum(user, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async addPhotos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { fileIds } = req.body;
      const album = await AlbumService.addPhotosToAlbum(user, req.params.id as string, fileIds || []);
      res.json({ success: true, data: album });
    } catch (err) {
      next(err);
    }
  }

  public static async removePhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await AlbumService.removePhotoFromAlbum(user, req.params.id as string, req.params.fileId as string);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  public static async shareAlbum(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await AlbumService.shareAlbum(user, req.params.id as string, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
