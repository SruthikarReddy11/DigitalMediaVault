import { Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';
import { AuthenticatedRequest } from '../types';

export class SearchController {
  public static async globalSearch(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const query = (req.query.q as string) || '';
      const category = (req.query.category as any) || 'all';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const results = await SearchService.globalSearch(user, query, {
        category,
        limit,
      });

      res.json({
        success: true,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  }
}
