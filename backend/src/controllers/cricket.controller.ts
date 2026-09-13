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

  /**
   * GET /api/cricket/scorecard?title=...&id=...
   * Returns full detailed scorecard for a match
   */
  public static async getMatchScorecard(req: Request, res: Response, next: NextFunction) {
    try {
      const title = (req.query.title as string) || '';
      const matchId = (req.query.id as string) || undefined;
      const result = await CricketService.getMatchScorecard(title, matchId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
