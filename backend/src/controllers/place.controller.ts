import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { PlaceService } from '../services/place.service';
import { GooglePlacesService } from '../services/googlePlaces.service';
import { Readable } from 'stream';

export class PlaceController {
  /**
   * Resolve a Google Maps URL into preview data
   */
  public static async resolve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const url = (req.body?.url || req.query?.url) as string;
      if (!url) {
        return res.status(400).json({
          success: false,
          error: { message: 'Google Maps URL is required.' },
        });
      }

      const preview = await PlaceService.resolveUrl(url);
      res.json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Proxy Google Places photo without exposing API key to frontend
   */
  public static async photoProxy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ref = (req.query.ref || req.query.photoreference) as string;
      if (!ref) {
        return res.status(400).json({
          success: false,
          error: { message: 'Photo reference is required.' },
        });
      }

      const maxWidth = req.query.maxwidth ? parseInt(req.query.maxwidth as string, 10) : 800;
      const { body, contentType } = await GooglePlacesService.fetchPhoto(ref, maxWidth);

      if (!body) {
        return res.status(404).json({ success: false, error: { message: 'Photo not found.' } });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours per Google Terms

      // Convert ReadableStream to Node readable stream
      const nodeStream = Readable.fromWeb(body as any);
      nodeStream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List saved places
   */
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, search, category, city, country, tag, sort } = req.query;

      const places = await PlaceService.listPlaces(req.user!.id, {
        status: status as any,
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        city: city ? String(city) : undefined,
        country: country ? String(country) : undefined,
        tag: tag ? String(tag) : undefined,
        sort: sort as any,
      });

      res.json({ success: true, data: places });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single place by ID
   */
  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const place = await PlaceService.getPlaceById(req.user!.id, id);
      res.json({ success: true, data: place });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create / Save place
   */
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const place = await PlaceService.createPlace(req.user!.id, req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
      res.status(201).json({ success: true, data: place });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update place
   */
  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const place = await PlaceService.updatePlace(req.user!.id, id, req.body, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
      res.json({ success: true, data: place });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Quick status update (e.g. Mark as Visited)
   */
  public static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: { message: 'Status is required.' } });
      }

      const place = await PlaceService.updateStatus(req.user!.id, id, status);
      res.json({ success: true, data: place });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Postpone reminder
   */
  public static async postponeReminder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reminderId = String(req.params.reminderId);
      const minutes = req.body?.minutes ? parseInt(req.body.minutes, 10) : 60;

      const reminder = await PlaceService.postponeReminder(req.user!.id, reminderId, minutes);
      res.json({ success: true, data: reminder });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete place
   */
  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const result = await PlaceService.deletePlace(req.user!.id, id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
