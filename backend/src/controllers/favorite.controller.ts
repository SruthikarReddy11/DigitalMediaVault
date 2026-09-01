import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { FavoriteService } from '../services/favorite.service';

export class FavoriteController {
  public static async toggle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await FavoriteService.toggleFavorite(String(req.params.fileId), req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getFavorites(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const favorites = await FavoriteService.getFavorites(req.user!);
      res.json({
        success: true,
        data: favorites,
      });
    } catch (err) {
      next(err);
    }
  }
}
