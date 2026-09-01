import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { FolderService } from '../services/folder.service';

export class FolderController {
  public static async createFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const folder = await FolderService.createFolder(req.body.name, req.body.parentId, req.user!);
      res.status(201).json({
        success: true,
        data: folder,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getFolders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parentId = req.query.parentId as string | undefined;
      const folders = await FolderService.getFolders(
        req.user!,
        parentId === 'root' ? null : parentId
      );
      res.json({
        success: true,
        data: folders,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getFolderTree(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tree = await FolderService.getFolderTree(req.user!);
      res.json({
        success: true,
        data: tree,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async renameFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const folder = await FolderService.renameFolder(String(req.params.id), req.body.name, req.user!);
      res.json({
        success: true,
        data: folder,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteFolder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await FolderService.deleteFolder(String(req.params.id), req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
