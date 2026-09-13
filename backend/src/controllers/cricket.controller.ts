import { Request, Response, NextFunction } from 'express';
import { CricketService } from '../services/cricket.service';

export class CricketController {
  /**
   * GET /api/cricket/live-scores
   * Returns parsed live cricket matches from Cricinfo
   */
  public static async getLiveScores(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CricketService.getLiveScores();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
