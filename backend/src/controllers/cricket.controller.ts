import { Request, Response, NextFunction } from 'express';
import { CricketService } from '../services/cricket.service';

export class CricketController {
  /**
   * GET /api/cricket/matches?type=all|live|upcoming|completed
   * Returns international matches list from ESPN Cricinfo
   */
  public static async getMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const type = (req.query.type as 'all' | 'live' | 'upcoming' | 'completed') || 'all';
      const result = await CricketService.getMatches(type);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/cricket/live-scores
   * Returns live international matches (backwards compatible)
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
   * GET /api/cricket/scorecard?id=...&title=...
   * Returns full detailed scorecard for an international match from ESPN Cricinfo
   */
  public static async getMatchScorecard(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = (req.query.id as string) || undefined;
      const title = (req.query.title as string) || undefined;
      const result = await CricketService.getMatchScorecard(matchId, title);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
