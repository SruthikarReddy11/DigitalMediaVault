import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { PlaylistService } from '../services/playlist.service';

export class PlaylistController {
  public static async createPlaylist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const playlist = await PlaylistService.createPlaylist(
        req.body.name,
        req.body.description,
        req.user!
      );
      res.status(201).json({
        success: true,
        data: playlist,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getPlaylists(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const playlists = await PlaylistService.getPlaylists(req.user!);
      res.json({
        success: true,
        data: playlists,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getPlaylist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const playlist = await PlaylistService.getPlaylist(String(req.params.id), req.user!);
      res.json({
        success: true,
        data: playlist,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updatePlaylist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await PlaylistService.updatePlaylist(String(req.params.id), req.body, req.user!);
      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deletePlaylist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await PlaylistService.deletePlaylist(String(req.params.id), req.user!);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async addSong(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await PlaylistService.addSongToPlaylist(
        String(req.params.id),
        req.body.musicId,
        req.user!
      );
      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async removeSong(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await PlaylistService.removeSongFromPlaylist(
        String(req.params.id),
        String(req.params.musicId),
        req.user!
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async reorder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await PlaylistService.reorderPlaylist(
        String(req.params.id),
        req.body.items,
        req.user!
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
