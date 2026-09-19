import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { TripPlanService } from '../services/tripPlan.service';

export class TripPlanController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const trips = await TripPlanService.list(req.user!.id);
      res.json({ success: true, data: trips });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const trip = await TripPlanService.getById(req.user!.id, id);
      res.json({ success: true, data: trip });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const trip = await TripPlanService.create(req.user!.id, req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
      res.status(201).json({ success: true, data: trip });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const trip = await TripPlanService.update(req.user!.id, id, req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
      res.json({ success: true, data: trip });
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await TripPlanService.delete(req.user!.id, id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
