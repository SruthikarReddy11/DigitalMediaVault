import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { TrashService } from '../services/trash.service';

export class TrashController {
  public static async getTrash(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const files = await TrashService.getTrashFiles(req.user!);
      res.json({
        success: true,
        data: files,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async restoreAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await TrashService.restoreAll(req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async emptyTrash(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await TrashService.emptyTrash(req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
